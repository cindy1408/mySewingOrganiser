package main

import (
	"net/http"
	"path/filepath"
	"strings"
)

// FileLoader serves files from the chosen patterns folder to the webview.
type FileLoader struct {
	app *App
}

func NewFileLoader(app *App) *FileLoader { return &FileLoader{app: app} }

func (h *FileLoader) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/localfile" {
		http.NotFound(w, r)
		return
	}
	p := filepath.Clean(r.URL.Query().Get("p"))

	// only allow files inside the folder the user picked
	rel, err := filepath.Rel(h.app.root, p)
	if h.app.root == "" || err != nil || strings.HasPrefix(rel, "..") {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	http.ServeFile(w, r, p)
}