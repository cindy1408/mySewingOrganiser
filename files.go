package main

import (
	"encoding/base64"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	goruntime "runtime"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// safePath returns the cleaned path only if it's inside the chosen folder.
func (a *App) safePath(path string) (string, error) {
	if a.root == "" {
		return "", errors.New("no folder selected")
	}
	p := filepath.Clean(path)
	rel, err := filepath.Rel(a.root, p)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", errors.New("path is outside the chosen folder")
	}
	return p, nil
}

// ReadFile returns a file's contents as base64.
func (a *App) ReadFile(path string) (string, error) {
	p, err := a.safePath(path)
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(p)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

// OpenFile opens a file in the system's default app.
func (a *App) OpenFile(path string) error {
	p, err := a.safePath(path)
	if err != nil {
		return err
	}
	switch goruntime.GOOS {
	case "darwin":
		return exec.Command("open", p).Start()
	case "windows":
		return exec.Command("cmd", "/c", "start", "", p).Start()
	default:
		return exec.Command("xdg-open", p).Start()
	}
}

// RevealFile shows the file in Finder / Explorer.
func (a *App) RevealFile(path string) error {
	p, err := a.safePath(path)
	if err != nil {
		return err
	}
	switch goruntime.GOOS {
	case "darwin":
		return exec.Command("open", "-R", p).Start()
	case "windows":
		return exec.Command("explorer", "/select,", p).Start()
	default:
		return exec.Command("xdg-open", filepath.Dir(p)).Start()
	}
}

// SaveCopy asks where to save and writes a copy of the file there.
func (a *App) SaveCopy(path string) error {
	p, err := a.safePath(path)
	if err != nil {
		return err
	}
	dest, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save a copy",
		DefaultFilename: filepath.Base(p),
	})
	if err != nil || dest == "" { // empty dest = user cancelled
		return err
	}
	data, err := os.ReadFile(p)
	if err != nil {
		return err
	}
	return os.WriteFile(dest, data, 0644)
}