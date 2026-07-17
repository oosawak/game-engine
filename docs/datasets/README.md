# VRM Motion Datasets

This folder stores dataset slots for the VRM editor.

- `dataset2.json` - active default slot
- `dataset3.json` - reserved slot
- `dataset4.json` - reserved slot
- `dataset5.json` - reserved slot

Each slot can extend `../vrm-motion-dataset.json` and later be replaced with its own motions.
The editor loads the selected slot and keeps per-slot drafts in browser local storage.
