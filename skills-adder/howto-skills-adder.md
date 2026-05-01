# LinkedIn Skill Adder Script

Browser-console JavaScript utility for adding multiple LinkedIn profile skills from a selected role-based skill profile.

## Purpose

This script automates the manual LinkedIn skill creation flow:

1. Open the LinkedIn **Skills** page.
2. Click the plus/add skill button.
3. Open the **Add skill** modal/page.
4. Enter a skill name into the skill input field.
5. Optionally select a matching LinkedIn typeahead suggestion.
6. Click **Save**.
7. If LinkedIn shows the confirmation modal, click **Add more skills** for the next skill.
8. After the last skill is processed, click **No thanks** to close the final modal.
9. Log each add attempt to the browser console.
10. Continue until all skills in the selected profile have been processed.

## Supported Skill Profiles

The script currently includes two predefined skill profiles.

### Product Owner

```js
productOwner
```

Includes skills such as:

* Product Strategy
* Roadmap Development
* Stakeholder Management
* Backlog Prioritization
* Data Analytics
* User Experience (UX) Design
* Agile Methodologies
* Scrum Leadership
* Market Research
* Business Case Development
* ROI Optimization
* Technical Documentation

### Azure AI Engineer

```js
azureAIEngineer
```

Includes skills such as:

* Azure OpenAI Service
* Azure Machine Learning (AML)
* Azure AI Search
* Prompt Engineering
* Retrieval-Augmented Generation (RAG)
* MLOps (MLflow & Azure DevOps)
* Azure AI Language & Speech
* Azure AI Vision
* Azure AI Document Intelligence
* Responsible AI & Content Safety
* Agentic AI Frameworks
* Azure Data Factory (ADF)
* Python / C# Proficiency
* REST API & SDK Integration

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

### 4. Run a Dry Run First

At the bottom of the script, use:

```js
await runProcess({
    profile: "productOwner",
    dryRun: true,
    overrides: {
        skipExistingSkills: true
    }
});
```

Dry run mode does not click LinkedIn controls. It only logs which skills would be added and which already appear to exist.

### 5. Run Real Addition

When ready, change the final call to:

```js
await runProcess({
    profile: "productOwner",
    dryRun: false,
    overrides: {
        skipExistingSkills: true
    }
});
```

To add the Azure AI Engineer skill profile instead:

```js
await runProcess({
    profile: "azureAIEngineer",
    dryRun: false,
    overrides: {
        skipExistingSkills: true
    }
});
```

## Configuration

### Profile Selection

The selected profile is passed into `runProcess()`:

```js
await runProcess({
    profile: "productOwner",
    dryRun: true
});
```

Available values:

```js
"productOwner"
"azureAIEngineer"
```

### Dry Run Mode

```js
dryRun: true
```

Logs skills that would be added without modifying LinkedIn.

```js
dryRun: false
```

Actually opens the add-skill dialog, enters the skill, selects a suggestion if available, clicks **Save**, and proceeds through the follow-up modal.

### Config Overrides

Optional behavior can be changed through `overrides`:

```js
await runProcess({
    profile: "productOwner",
    dryRun: false,
    overrides: {
        waitAfterTypingMs: 1500,
        elementWaitTimeoutMs: 30000,
        waitAfterAddMoreClickMs: 1500,
        waitAfterNoThanksClickMs: 1500,
        skipExistingSkills: true
    }
});
```

Common options:

```js
skipExistingSkills: true
```

Skips skills that are already detected on the visible LinkedIn Skills page.

```js
elementWaitTimeoutMs: 30000
```

Increases wait time for slow LinkedIn modal or input rendering.

```js
waitAfterTypingMs: 1500
```

Increases wait time after inserting text, useful if LinkedIn typeahead suggestions load slowly.

```js
waitAfterAddMoreClickMs: 1500
```

Increases wait time after clicking **Add more skills**.

```js
waitAfterNoThanksClickMs: 1500
```

Increases wait time after clicking **No thanks** at the end of the process.

## Existing Skill Detection

The script checks currently visible skill edit links to decide whether a skill already exists.

It looks for signals such as:

```js
a[href*="/details/skills/edit/forms/"]
```

and edit labels like:

```text
Edit <skill> skill
```

or German variants such as:

```text
<skill> bearbeiten
```

## Important Behavior

The script uses exact normalized matching for duplicate detection.

For example:

```text
Agile Softwareentwicklung
```

is not treated as the same as:

```text
Agile Methodologies
```

If you already have translated or alternative skill names, the script may still attempt to add the English profile skill.

## Console Logging

Each add attempt is logged to the browser console.

Example statuses:

```text
ADDED
SKIPPED
FAILED
DRY_RUN
```

Each log entry contains:

* index
* timestamp
* profile
* skill name
* status
* details

The full add log is available at:

```js
window.linkedinSkillAdderLog
```

View it as a table:

```js
console.table(window.linkedinSkillAdderLog);
```

## Stop the Script

To stop a running add process, run:

```js
stopLinkedInSkillAdder();
```

## What the Script Looks For

The script avoids LinkedIn’s unstable generated CSS classes.

Instead, it targets more stable page signals.

### Add skill button

The script searches for links, buttons, or plus icons such as:

```js
a[href*="/skills/edit/forms/new/"]
a[href*="/details/skills/edit/forms/new/"]
button[aria-label*="Add a skill"]
svg#add-medium
```

### Skill input

The script searches for inputs such as:

```js
input[data-testid="typeahead-input"]
input[aria-label="Skill*"]
input[placeholder*="Skill"]
input[aria-autocomplete="list"]
```

### Save button

The script searches for enabled buttons with text or labels such as:

```text
Save
Speichern
```

### Add more skills button

After saving a skill, LinkedIn may show a confirmation modal. The script detects and clicks **Add more skills** for the next skill.

It searches for signals such as:

```text
Add more skills
Weitere Kenntnisse hinzufügen
```

and links such as:

```js
a[href*="/skills/edit/forms/new/"]
a[href*="/details/skills/edit/forms/new/"]
```

### No thanks button

After the last skill is processed, the script attempts to close the final confirmation modal by clicking **No thanks**.

It searches for labels such as:

```text
No thanks
Nein danke
Not now
Skip
```

## Browser Focus Requirement

Keep the LinkedIn browser tab/window in the foreground while the script is running.

If the tab is moved to the background, minimized, or covered for too long, LinkedIn or the browser may throttle timers, delay DOM updates, or pause parts of the page lifecycle. This can cause the add loop to stop, miss buttons, fail to detect the input, fail to detect **Add more skills**, or fail to detect **No thanks**.

Recommended:

* Keep the LinkedIn Skills tab active and visible.
* Do not switch tabs while the script is adding skills.
* Do not minimize the browser window.
* Monitor the console until the script finishes.

## Troubleshooting

### The script cannot find the Add skill button

Possible causes:

* You are not on the full LinkedIn Skills page.
* The add button is not currently visible.
* LinkedIn changed the DOM.
* Your interface language uses a different label.

Try:

1. Refresh the Skills page.
2. Scroll to the top of the skills page.
3. Confirm the plus/add button is visible.
4. Run the script again.

### The script cannot find the skill input

Possible causes:

* The add modal did not open.
* LinkedIn loaded slowly.
* The input label changed.

Try increasing:

```js
elementWaitTimeoutMs: 30000
```

### The script cannot find the Save button

Possible causes:

* LinkedIn requires selecting a typeahead suggestion first.
* The typed skill was not accepted.
* The Save button is still disabled.
* The input did not receive the value properly.

Try increasing:

```js
waitAfterTypingMs: 1500
```

or:

```js
waitAfterSuggestionClickMs: 1200
```

### The script cannot find Add more skills

Possible causes:

* LinkedIn changed the confirmation modal.
* The modal has not loaded yet.
* The interface language uses different wording.

Try increasing:

```js
waitAfterSaveClickMs: 2500
waitAfterAddMoreClickMs: 2000
```

If the button text differs, add the text to `findAddMoreSkillsButton()`.

### The script cannot find No thanks

Possible causes:

* The final confirmation modal did not appear.
* LinkedIn used different wording.
* The modal closed automatically.

If the process otherwise completed, this may be harmless.

If the button text differs, add the text to `findNoThanksButton()`.

### The script says a skill already exists, but you do not see it

The duplicate check only uses skills visible or loaded in the current DOM. LinkedIn may lazy-load the skill list. Scroll the Skills page to load more skills, then rerun the script.

### The script tries to add a skill that already exists under another language

The script does not do semantic matching. Add translated or alternative skill names manually to your profile logic if needed.

## Safety Notes

* Always run with `dryRun: true` first.
* Review the console output before running with `dryRun: false`.
* Keep `skipExistingSkills: true` unless you intentionally want to retry all skills.
* Keep the LinkedIn tab/window in the foreground while the script runs.
* LinkedIn may change its HTML structure at any time.
* Use at your own risk.

## Recommended Workflow

1. Open the LinkedIn Skills page.
2. Run the script with:

```js
await runProcess({
    profile: "productOwner",
    dryRun: true,
    overrides: {
        skipExistingSkills: true
    }
});
```

3. Review the console table.
4. Confirm which skills would be added and which are skipped.
5. Run again with:

```js
await runProcess({
    profile: "productOwner",
    dryRun: false,
    overrides: {
        skipExistingSkills: true
    }
});
```

6. Keep the LinkedIn tab in the foreground.
7. Monitor the console log.
8. Confirm the script clicks **No thanks** after the final skill.
9. Stop if needed:

```js
stopLinkedInSkillAdder();
```

## MIT License

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
