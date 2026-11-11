package main

import (
	"io/fs"
	"path/filepath"
	"strings"
)

type Pattern struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Type    string `json:"type"` // "image" or "pdf"
	ModTime int64  `json:"modTime"`
}

var fileKinds = map[string]string{
	".jpg": "image", ".jpeg": "image", ".png": "image", ".webp": "image",
	".pdf": "pdf",
}

// ScanFolder walks the folder and returns every image and PDF it finds.
func (a *App) ScanFolder(root string) ([]Pattern, error) {
	a.root = filepath.Clean(root)
	patterns := []Pattern{}

	err := filepath.WalkDir(a.root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil // skip unreadable entries, keep going
		}
		if d.IsDir() {
			if strings.HasPrefix(d.Name(), ".") && path != a.root {
				return filepath.SkipDir
			}
			return nil
		}
		ext := filepath.Ext(path)
		kind, ok := fileKinds[strings.ToLower(ext)]
		if !ok {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return nil
		}
		patterns = append(patterns, Pattern{
			Name:    strings.TrimSuffix(d.Name(), ext),
			Path:    path,
			Type:    kind,
			ModTime: info.ModTime().Unix(),
		})
		return nil
	})
	return patterns, err
}