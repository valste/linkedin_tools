# LinkedIn Skill Cleanup Script

Browser-console JavaScript utility for deleting multiple LinkedIn profile skills while keeping selected role-based skill lists.

## Purpose

This script automates the manual LinkedIn skill deletion flow:

1. Open the LinkedIn **Skills** page.
2. Find the pencil/edit icon for a skill.
3. Open the skill edit modal/page.
4. Click **Delete skill**.
5. Confirm deletion.
6. Log each deletion attempt to the browser console.
7. Continue until no more non-kept skills are found.

## Supported Skill Profiles

The script currently includes two predefined keep-lists:

### Product Owner

```js
productOwner
```

Keeps skills such as:

* Product Strategy
* Roadmap Development
* Stakeholder Management
* Backlog Prioritization
* Data Analytics
* Agile Methodologies
* Scrum Leadership
* Business Case Development

### Azure AI Engineer

```js
azureAIEngineer
```

Keeps skills such as:

* Azure OpenAI Service
* Azure Machine Learning
* Azure AI Search
* Prompt Engineering
* Retrieval-Augmented Generation
* MLOps
* Azure AI Document Intelligence
* REST API & SDK Integration

## Important Behavior

The script uses **exact normalized matching**.

That means:

```text
Agile Softwareentwicklung
```

is **not** treated as the same as:

```text
Agile Methodologies
```

If you want to keep existing German or alternative skill names, add them manually to the selected skill profile.

Example:

```js
productOwner: [
    "Product Strategy",
    "Agile Methodologies",

    // Existing LinkedIn skills to keep
    "Agile Softwareentwicklung",
    "Agile Project Management"
]
```

## How to Use

### 1. Open the LinkedIn Skills Page

Go to your LinkedIn profile skills page.

Typical URL pattern:

```text
https://www.linkedin.com/in/<your-profile>/details/skills/
```

### 2. Open Browser DevTools

Open the browser console:

* Chrome / Edge: `F12` or `Ctrl + Shift + J`
* Firefox: `F12` or `Ctrl + Shift + K`

### 3. Paste the Script

Paste the full JavaScript script into the console.

### 4. Test First with Dry Run

Before deleting anything, use:

```js
dryRun: true
```

This will only log the first skill that would be deleted.

### 5. Run Real Deletion

When ready, change:

```js
dryRun: true
```

to:

```js
dryRun: false
```

Then run the script again.

## Configuration

### Select Skill Profile

Choose which skills should be kept:

```js
const selectedSkillProfile = "productOwner";
```

Available values:

```js
"productOwner"
"azureAIEngineer"
```

Example:

```js
const selectedSkillProfile = "azureAIEngineer";
```

### Dry Run Mode

```js
dryRun: true
```

Only logs the first skill that would be deleted.

```js
dryRun: false
```

Actually clicks edit, delete, and confirm.

### Maximum Deletion Cycles

```js
maxCycles: 200
```

Maximum number of skills the script will attempt to process.

### Unknown Skill Protection

```js
deleteUnknownSkills: false
```

Recommended default. Prevents deletion if the script cannot detect the skill name.

```js
deleteUnknownSkills: true
```

Allows deletion even if the skill name cannot be detected.

Use with caution.

## Console Logging

Each deletion attempt is logged to the browser console.

Example statuses:

```text
DELETED
FAILED
DRY_RUN
```

Each log entry contains:

* index
* timestamp
* skill name
* status
* details

The full deletion log is available at:

```js
window.linkedinSkillCleanupDeletionLog
```

View it as a table:

```js
console.table(window.linkedinSkillCleanupDeletionLog);
```

## Stop the Script

To stop a running cleanup process, run:

```js
stopLinkedInSkillCleanup();
```

## What the Script Looks For

The script avoids LinkedIn’s unstable generated CSS classes.

Instead, it targets more stable page signals:

### Skill edit links

```js
a[href*="/details/skills/edit/forms/"]
```

### Edit buttons / pencil icons

```js
aria-label="Edit <skill> skill"
```

### Delete buttons

The script searches for button text such as:

```text
Delete skill
Delete
Skill löschen
Kenntnis löschen
Löschen
```

## Troubleshooting

### The script says: “Edit UI was not detected”

Possible causes:

* The LinkedIn page loaded slowly.
* The edit click did not open the modal.
* LinkedIn changed its DOM.
* The page is not the full Skills page.

Try:

1. Refresh the LinkedIn Skills page.
2. Scroll so the skills are visible.
3. Run the script again.
4. Increase:

```js
elementWaitTimeoutMs: 30000
```

### The script cannot find “Delete skill”

Open one skill manually and run:

```js
Array.from(document.querySelectorAll("button, button span, button *"))
    .map((el, index) => ({
        index,
        tag: el.tagName,
        textContent: el.textContent?.replace(/\s+/g, " ").trim(),
        innerText: el.innerText?.replace(/\s+/g, " ").trim(),
        closestButton: !!el.closest("button"),
        element: el
    }))
    .filter(x =>
        String(x.textContent || x.innerText || "")
            .toLowerCase()
            .includes("delete")
    );
```

If LinkedIn shows a different button text, add that text to:

```js
waitForDeleteSkillButton()
```

or:

```js
waitForFinalDeleteButton()
```

### The script keeps deleting skills you wanted to keep

Add the exact LinkedIn skill name to the selected profile.

Example:

```js
"Agile Softwareentwicklung"
```

The script does not perform semantic or fuzzy matching.

## Safety Notes

* Always run with `dryRun: true` first.
* Review the keep-list before running with `dryRun: false`.
* Keep `deleteUnknownSkills: false` unless you intentionally want aggressive deletion.
* LinkedIn may change its HTML structure at any time.
* Use at your own risk.

## Browser Focus Requirement

Keep the LinkedIn browser tab/window in the foreground while the script is running.

If the tab is moved to the background, minimized, or covered for too long, LinkedIn or the browser may throttle timers, delay DOM updates, or pause parts of the page lifecycle. This can cause the deletion loop to stop, miss buttons, or fail to detect deletion completion.

Recommended:

* Keep the LinkedIn Skills tab active and visible.
* Do not switch tabs while the script is deleting skills.
* Do not minimize the browser window.
* Monitor the console until the script finishes.

## Recommended Workflow

1. Open LinkedIn Skills page.
2. Run script with:

```js
dryRun: true
```

3. Check the console output.
4. Add any skills you want to keep to the selected profile.
5. Set:

```js
dryRun: false
```

6. Run again.
7. Monitor the console log.
8. Stop if needed:

```js
stopLinkedInSkillCleanup();
```

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
