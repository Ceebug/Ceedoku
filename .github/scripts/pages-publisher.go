
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

const apiVersion = "2022-11-28"

var excluded = map[string]bool{
	".git":             true,
	".github":          true,
	"node_modules":     true,
	".vscode":          true,
	".idea":            true,
	"vendor":           true,
	"package.json":     true,
	"package-lock.json": true,
	"Gemfile":          true,
	"Gemfile.lock":     true,
	"_config.yml":      true,
	"README.md":        true,
	"LICENSE":          true,
}

func required(name string) (string, error) {
	value := os.Getenv(name)
	if value == "" {
		return "", fmt.Errorf("missing environment variable: %s", name)
	}
	return value, nil
}

func prepare() error {
	source, err := required("SOURCE_DIR")
	if err != nil {
		return err
	}

	output, err := required("PUBLISH_DIR")
	if err != nil {
		return err
	}

	source, err = filepath.Abs(source)
	if err != nil {
		return err
	}

	output, err = filepath.Abs(output)
	if err != nil {
		return err
	}

	if source == output || strings.HasPrefix(output, source+string(os.PathSeparator)) {
		return errors.New("publish directory must be outside the source directory")
	}

	if err := os.RemoveAll(output); err != nil {
		return err
	}

	if err := os.MkdirAll(output, 0755); err != nil {
		return err
	}

	count := 0

	err = filepath.WalkDir(source, func(
		current string,
		entry fs.DirEntry,
		walkErr error,
	) error {
		if walkErr != nil {
			return walkErr
		}

		relative, err := filepath.Rel(source, current)
		if err != nil {
			return err
		}

		if relative == "." {
			return nil
		}

		relative = filepath.ToSlash(relative)
		name := entry.Name()

		if excluded[name] {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		if strings.HasPrefix(name, ".") &&
			(name == ".DS_Store" || name == ".env") {
			return nil
		}

		info, err := entry.Info()
		if err != nil {
			return err
		}

		// Never follow symbolic links.
		if info.Mode()&os.ModeSymlink != 0 {
			return nil
		}

		if entry.IsDir() {
			return nil
		}

		if !info.Mode().IsRegular() {
			return nil
		}

		destination := filepath.Join(output, filepath.FromSlash(relative))

		if err := os.MkdirAll(filepath.Dir(destination), 0755); err != nil {
			return err
		}

		if err := copyFile(current, destination, info.Mode().Perm()); err != nil {
			return err
		}

		count++
		return nil
	})

	if err != nil {
		return err
	}

	if count == 0 {
		return errors.New("no website files found")
	}

	fmt.Printf("Prepared %d website files.\n", count)
	fmt.Printf("Output: %s\n", output)

	return nil
}

func copyFile(source, destination string, mode fs.FileMode) error {
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()

	output, err := os.OpenFile(
		destination,
		os.O_CREATE|os.O_WRONLY|os.O_TRUNC,
		mode,
	)
	if err != nil {
		return err
	}

	_, copyErr := io.Copy(output, input)
	closeErr := output.Close()

	if copyErr != nil {
		return copyErr
	}

	return closeErr
}

func deploy() error {
	repository, err := required("GITHUB_REPOSITORY")
	if err != nil {
		return err
	}

	sha, err := required("GITHUB_SHA")
	if err != nil {
		return err
	}

	token, err := required("GITHUB_TOKEN")
	if err != nil {
		return err
	}

	artifactID, err := required("PAGES_ARTIFACT_ID")
	if err != nil {
		return err
	}

	requestURL, err := required("ACTIONS_ID_TOKEN_REQUEST_URL")
	if err != nil {
		return err
	}

	requestToken, err := required("ACTIONS_ID_TOKEN_REQUEST_TOKEN")
	if err != nil {
		return err
	}

	parts := strings.Split(repository, "/")
	if len(parts) != 2 {
		return fmt.Errorf("invalid repository name: %s", repository)
	}

	// Request the Pages-specific OIDC token.
	oidcURL, err := url.Parse(requestURL)
	if err != nil {
		return err
	}

	oidcURL.Query().Add("audience", "https://github.com/"+parts[0])

	query := oidcURL.Query()
	query.Set("audience", "https://github.com/"+parts[0])
	oidcURL.RawQuery = query.Encode()

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	oidcRequest, err := http.NewRequest(
		http.MethodGet,
		oidcURL.String(),
		nil,
	)
	if err != nil {
		return err
	}

	oidcRequest.Header.Set(
		"Authorization",
		"Bearer "+requestToken,
	)

	oidcResponse, err := client.Do(oidcRequest)
	if err != nil {
		return err
	}
	defer oidcResponse.Body.Close()

	if oidcResponse.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(oidcResponse.Body)
		return fmt.Errorf(
			"OIDC request failed: %s: %s",
			oidcResponse.Status,
			body,
		)
	}

	var oidc struct {
		Value string `json:"value"`
	}

	if err := json.NewDecoder(oidcResponse.Body).Decode(&oidc); err != nil {
		return err
	}

	if oidc.Value == "" {
		return errors.New("OIDC response contained no token")
	}

	// Submit the uploaded artifact to GitHub Pages.
	payload := map[string]string{
		"artifact_id":        artifactID,
		"pages_build_version": sha,
		"oidc_token":         oidc.Value,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	deployURL := fmt.Sprintf(
		"https://api.github.com/repos/%s/pages/deployments",
		repository,
	)

	deployRequest, err := http.NewRequest(
		http.MethodPost,
		deployURL,
		bytes.NewReader(body),
	)
	if err != nil {
		return err
	}

	deployRequest.Header.Set("Authorization", "Bearer "+token)
	deployRequest.Header.Set("Accept", "application/vnd.github+json")
	deployRequest.Header.Set("Content-Type", "application/json")
	deployRequest.Header.Set("X-GitHub-Api-Version", apiVersion)

	deployResponse, err := client.Do(deployRequest)
	if err != nil {
		return err
	}
	defer deployResponse.Body.Close()

	responseBody, err := io.ReadAll(deployResponse.Body)
	if err != nil {
		return err
	}

	if deployResponse.StatusCode != http.StatusOK {
		return fmt.Errorf(
			"Pages deployment failed: %s: %s",
			deployResponse.Status,
			responseBody,
		)
	}

	var result struct {
		ID        string `json:"id"`
		StatusURL string `json:"status_url"`
		PageURL   string `json:"page_url"`
	}

	if err := json.Unmarshal(responseBody, &result); err != nil {
		return err
	}

	fmt.Println("GitHub Pages accepted the deployment.")
	fmt.Printf("Commit: %s\n", sha)
	fmt.Printf("Deployment: %s\n", result.ID)
	fmt.Printf("Website: %s\n", result.PageURL)

	return nil
}

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "Usage: pages-publisher prepare|deploy")
		os.Exit(2)
	}

	var err error

	switch os.Args[1] {
	case "prepare":
		err = prepare()
	case "deploy":
		err = deploy()
	default:
		err = fmt.Errorf("unknown command: %s", os.Args[1])
	}

	if err != nil {
		fmt.Fprintln(os.Stderr, "ERROR:", err)
		os.Exit(1)
	}
}
