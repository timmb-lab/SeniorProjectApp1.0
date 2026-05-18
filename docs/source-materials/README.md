# Source Materials

Date extracted: 2026-05-18

This folder contains page-bounded text extracted from the four Senior Project PDFs supplied on 2026-05-17. The extraction used embedded PDF text through `pypdf`; no OCR was needed.

Files:

- `research-proposal-challenge.txt`
- `senior-project-cycle-linked-document.txt`
- `senior-guide.txt`
- `mentor-teacher-guide.txt`
- `extraction-manifest.json`

Notes:

- Page markers are included so app requirements can be traced back to source pages.
- Some characters in the PDF text extract as encoding artifacts. The derived framework in `data/capstone-framework.json` uses normalized wording.
- Line-end layout whitespace from the PDF extraction is trimmed so the files stay reviewable in git.
- These files are source captures. Product behavior should be built from the structured framework and integration docs rather than by copying this text into static pages.
