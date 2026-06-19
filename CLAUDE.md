# PlanAssist Frontend Development Rules

## System Context
- This repository handles the core UI and platform layouts via `App.jsx` and `AppHPT.jsx`.

## Git & Workflow Rules
- ALWAYS pull context directly from the repository. Do not ask the user to manually upload files.
- NEVER overwrite or rewrite a full code file. Only modify targeted blocks, components, or specific lines.
- DEFAULT BRANCH: All development tasks must be committed to the `staging` branch. 
- When a task is complete, commit the changes to `staging` and open a Pull Request from `staging` into `main`. Do not create random feature branches.
- AUTOMATED CLEANUP: Immediately after a Pull Request is successfully merged into `main`, you must automatically switch back to the `staging` branch and pull/merge the updated `main` branch back into `staging`. Never leave `staging` behind `main`.

## Asset Handling
- Ignore all non-text binary media files (such as `.mp3`, `.wav`, or `.ogg` audio assets). Do not attempt to read, index, or modify them.
