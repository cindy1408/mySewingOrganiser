package main

import (
	"context"
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"
	"os"
	"encoding/base64"
	goruntime "runtime"
	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx  context.Context
	root string
}

func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type Pattern struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Type    string `json:"type"`
	ModTime int64  `json:"modTime"`
}

// ChooseFolder opens the native folder picker.
func (a *App) ChooseFolder() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Choose your patterns folder",
	})
}

// ReadFile returns a file's contents as base64, but only from inside the chosen folder.
func (a *App) ReadFile(path string) (string, error) {
	p := filepath.Clean(path)
	rel, err := filepath.Rel(a.root, p)
	if a.root == "" || err != nil || strings.HasPrefix(rel, "..") {
		return "", fmt.Errorf("forbidden")
	}
	data, err := os.ReadFile(p)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

// ScanFolder walks the folder and returns every image and PDF it finds.
func (a *App) ScanFolder(root string) ([]Pattern, error) {
	a.root = root
	patterns := []Pattern{}

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil // skip anything unreadable, keep going
		}
		if d.IsDir() {
			// skip hidden folders like .git
			if strings.HasPrefix(d.Name(), ".") && path != root {
				return filepath.SkipDir
			}
			return nil
		}

		var kind string
		switch strings.ToLower(filepath.Ext(path)) {
		case ".jpg", ".jpeg", ".png", ".webp":
			kind = "image"
		case ".pdf":
			kind = "pdf"
		default:
			return nil
		}

		info, err := d.Info()
		if err != nil {
			return nil
		}
		patterns = append(patterns, Pattern{
			Name:    strings.TrimSuffix(d.Name(), filepath.Ext(path)),
			Path:    path,
			Type:    kind,
			ModTime: info.ModTime().Unix(),
		})
		return nil
	})

	return patterns, err
}

// OpenFile opens a file in the system's default app, only from inside the chosen folder.
func (a *App) OpenFile(path string) error {
	p := filepath.Clean(path)
	rel, err := filepath.Rel(a.root, p)
	if a.root == "" || err != nil || strings.HasPrefix(rel, "..") {
		return fmt.Errorf("forbidden")
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

// SaveCopy asks where to save and writes a copy of the file there.
func (a *App) SaveCopy(path string) error {
	p := filepath.Clean(path)
	rel, err := filepath.Rel(a.root, p)
	if a.root == "" || err != nil || strings.HasPrefix(rel, "..") {
		return fmt.Errorf("forbidden")
	}
	dest, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save a copy",
		DefaultFilename: filepath.Base(p),
	})
	if err != nil || dest == "" {
		return err // empty dest means the user cancelled
	}
	data, err := os.ReadFile(p)
	if err != nil {
		return err
	}
	return os.WriteFile(dest, data, 0644)
}

// RevealFile shows the file in Finder / Explorer.
func (a *App) RevealFile(path string) error {
	p := filepath.Clean(path)
	rel, err := filepath.Rel(a.root, p)
	if a.root == "" || err != nil || strings.HasPrefix(rel, "..") {
		return fmt.Errorf("forbidden")
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