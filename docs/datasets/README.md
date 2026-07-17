# VRM Motion Datasets

This folder stores dataset slots for the VRM editor.

- `dataset1.json` - default slot
- `dataset2.json` - alternate slot
- `dataset3.json` - alternate slot
- `dataset4.json` - alternate slot

Each slot can extend `../vrm-motion-dataset.json` and later be replaced with its own motions.
The editor loads the selected slot and keeps per-slot drafts in browser local storage.
