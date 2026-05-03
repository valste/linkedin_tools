(async () => {
    /******************************************************************
     * LINKEDIN SKILL ADDER
     *
     * Flow:
     * 1. Start on LinkedIn Skills page.
     * 2. Click Add skill / plus button.
     * 3. Enter skill.
     * 4. Click Save.
     * 5. If LinkedIn shows "Add more skills", click it for the next skill.
     * 6. After the last skill, click "No thanks" to complete the process.
     *
     * Configure at the bottom:
     *
     * await runProcess({
     *     profile: "productOwner",
     *     dryRun: true
     * });
     ******************************************************************/

    const skillProfiles = {
        productOwner: [
            "Product Strategy",
            "Roadmap Development",
            "Stakeholder Management",
            "Backlog Prioritization",
            "Data Analytics",
            "User Experience (UX) Design",
            "Agile Methodologies",
            "Scrum Leadership",
            "Market Research",
            "Business Case Development",
            "ROI Optimization",
            "Technical Documentation"
        ],

        aiEngineer: [
            "Machine Learning & Deep Learning",
            "Python Programming",
            "Prompt Engineering & LLMs",
            "MLOps & Deployment",
            "Natural Language Processing",
            "Data Engineering",
            "Computer Vision",
            "Agentic AI",
            "AI Ethics & Governance",
            "Cloud AI Infrastructure"
        ],

        azureAIEngineer: [
            "Azure OpenAI Service",
            "Azure Machine Learning (AML)",
            "Azure AI Search",
            "Prompt Engineering",
            "Retrieval-Augmented Generation (RAG)",
            "MLOps (MLflow & Azure DevOps)",
            "Azure AI Language & Speech",
            "Azure AI Vision",
            "Azure AI Document Intelligence",
            "Responsible AI & Content Safety",
            "Agentic AI Frameworks",
            "Azure Data Factory (ADF)",
            "Python / C# Proficiency",
            "REST API & SDK Integration"
        ]
    };

    const defaultConfig = {
        maxCycles: 100,

        waitAfterAddClickMs: 1200,
        waitAfterTypingMs: 1300,
        waitAfterSuggestionClickMs: 800,
        waitAfterSaveClickMs: 1800,
        waitAfterAddMoreClickMs: 1200,
        waitAfterNoThanksClickMs: 1200,
        waitBetweenSkillsMs: 1500,

        elementWaitTimeoutMs: 20000,
        saveCompletionTimeoutMs: 30000,

        skipExistingSkills: true
    };

    let selectedSkillProfile = null;
    let skillsToAdd = [];
    let config = null;

    const runId = Date.now();
    window.__linkedinSkillAdderRunId = runId;

    // Target: Check whether this script run is still active.
    function isCurrentRun() {
        return window.__linkedinSkillAdderRunId === runId;
    }

    // Target: Stop script manually from console.
    window.stopLinkedInSkillAdder = function stopLinkedInSkillAdder() {
        window.__linkedinSkillAdderRunId = null;
        console.warn("LinkedIn skill adder stopped.");
    };

    // Target: Normalize text for stable matching.
    function normalize(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    // Target: Pause execution.
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Target: Check whether an element is visible.
    function isVisible(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0"
        );
    }

    // Target: Click element using mouse events plus native click.
    function clickElement(element) {
        if (!element) return false;

        element.scrollIntoView({ block: "center", behavior: "auto" });

        element.dispatchEvent(new MouseEvent("mouseover", {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        element.dispatchEvent(new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        element.dispatchEvent(new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        element.click();

        return true;
    }

    // Target: Wait until a DOM condition returns truthy.
    async function waitForCondition(predicate, timeoutMs, intervalMs = 300) {
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeoutMs) {
            if (!isCurrentRun()) return null;

            const result = predicate();

            if (result) return result;

            await wait(intervalMs);
        }

        return null;
    }

    const addLog = [];
    window.linkedinSkillAdderLog = addLog;

    // Target: Log every add attempt/result.
    function logAdd(skillName, status, details = "") {
        const entry = {
            index: addLog.length + 1,
            timestamp: new Date().toISOString(),
            profile: selectedSkillProfile,
            skill: skillName,
            status,
            details
        };

        addLog.push(entry);

        console.log(
            `%c[LinkedIn Skill Adder]%c ${status}: ${skillName}`,
            "background:#222;color:#bada55;font-weight:bold;padding:2px 4px;",
            "color:#000;font-weight:bold;"
        );

        if (details) {
            console.log(`Details: ${details}`);
        }

        console.table(addLog);

        return entry;
    }

    /******************************************************************
     * EXISTING SKILL DETECTION
     ******************************************************************/

    // Target: Extract skill name from edit/pencil element.
    function parseSkillNameFromEditElement(element) {
        const aria = element.getAttribute("aria-label") || "";
        const title = element.getAttribute("title") || "";
        const text = element.innerText || element.textContent || "";

        const candidates = [aria, title, text];

        const patterns = [
            /^edit\s+(.+?)\s+skill$/i,
            /^edit\s+(.+)$/i,
            /^bearbeiten\s+(.+?)\s+kenntnis$/i,
            /^(.+?)\s+bearbeiten$/i
        ];

        for (const candidate of candidates) {
            const clean = candidate.replace(/\s+/g, " ").trim();

            for (const pattern of patterns) {
                const match = clean.match(pattern);

                if (match?.[1]) {
                    return match[1].trim();
                }
            }
        }

        return null;
    }

    // Target: Get existing skill names visible on current Skills page.
    function getExistingVisibleSkills() {
        const selector = [
            'a[href*="/details/skills/edit/forms/"]',
            'button[aria-label^="Edit "][aria-label*=" skill"]',
            'a[aria-label^="Edit "][aria-label*=" skill"]',
            'button[aria-label*="Edit"][aria-label*="skill"]',
            'a[aria-label*="Edit"][aria-label*="skill"]',
            'button[aria-label*="Bearbeiten"]',
            'a[aria-label*="Bearbeiten"]'
        ].join(",");

        return Array.from(document.querySelectorAll(selector))
            .filter(isVisible)
            .map(parseSkillNameFromEditElement)
            .filter(Boolean);
    }

    // Target: Check whether skill already exists among visible skills.
    function skillAlreadyExists(skillName) {
        const existing = getExistingVisibleSkills().map(normalize);
        return existing.includes(normalize(skillName));
    }

    /******************************************************************
     * BUTTON / INPUT FINDERS
     ******************************************************************/

    // Target: Find post-save "Add more skills" button/link.
    function findAddMoreSkillsButton() {
        const candidates = Array.from(
            document.querySelectorAll("a, button, a span, button span, a *, button *")
        ).filter(isVisible);

        for (const candidate of candidates) {
            const text = normalize(candidate.innerText || candidate.textContent);
            const aria = normalize(candidate.getAttribute?.("aria-label"));
            const href = normalize(candidate.getAttribute?.("href"));

            const matches =
                text.includes("add more skills") ||
                aria.includes("add more skills") ||
                text.includes("weitere kenntnisse hinzufügen") ||
                aria.includes("weitere kenntnisse hinzufügen") ||
                href.includes("/skills/edit/forms/new/") ||
                href.includes("/details/skills/edit/forms/new/");

            if (!matches) continue;

            const clickable = candidate.closest("a, button");

            if (
                clickable &&
                isVisible(clickable) &&
                clickable.getAttribute("aria-disabled") !== "true"
            ) {
                return clickable;
            }
        }

        return null;
    }

    // Target: Find final post-save "No thanks" button.
    function findNoThanksButton() {
        const candidates = Array.from(
            document.querySelectorAll("button, button span, button *")
        ).filter(isVisible);

        for (const candidate of candidates) {
            const text = normalize(candidate.innerText || candidate.textContent);
            const aria = normalize(candidate.getAttribute?.("aria-label"));
            const title = normalize(candidate.getAttribute?.("title"));

            const matches =
                text === "no thanks" ||
                text.includes("no thanks") ||
                aria === "no thanks" ||
                aria.includes("no thanks") ||
                title === "no thanks" ||
                title.includes("no thanks") ||

                // German fallback
                text === "nein danke" ||
                text.includes("nein danke") ||
                aria === "nein danke" ||
                aria.includes("nein danke") ||

                // Other possible LinkedIn wording
                text === "not now" ||
                text.includes("not now") ||
                text === "skip" ||
                text.includes("skip");

            if (!matches) continue;

            const button = candidate.closest("button");

            if (
                button &&
                isVisible(button) &&
                !button.disabled &&
                button.getAttribute("aria-disabled") !== "true"
            ) {
                return button;
            }
        }

        return null;
    }

    // Target: Click "No thanks" at the end of the full add flow.
    async function clickNoThanksIfPresent() {
        const noThanksButton = await waitForCondition(() => {
            return findNoThanksButton();
        }, 5000, 250);

        if (!noThanksButton) {
            console.log('"No thanks" button not found. Nothing to close.');
            return false;
        }

        console.log('Clicking final "No thanks" button to complete the process.');

        if (!config.dryRun) {
            clickElement(noThanksButton);
        }

        await wait(config.waitAfterNoThanksClickMs);

        return true;
    }

    // Target: Find normal Add skill button or post-save Add more skills button.
    function findAddSkillButton() {
        const addMoreButton = findAddMoreSkillsButton();

        if (addMoreButton) {
            return addMoreButton;
        }

        const selectors = [
            'a[href*="/skills/edit/forms/new/"]',
            'a[href*="/details/skills/edit/forms/new/"]',

            'button[aria-label*="Add a skill"]',
            'a[aria-label*="Add a skill"]',
            'button[aria-label*="Add skill"]',
            'a[aria-label*="Add skill"]',

            'button[aria-label*="Kenntnis hinzufügen"]',
            'a[aria-label*="Kenntnis hinzufügen"]',
            'button[aria-label*="Skill hinzufügen"]',
            'a[aria-label*="Skill hinzufügen"]'
        ];

        for (const selector of selectors) {
            const candidate = Array.from(document.querySelectorAll(selector))
                .find(isVisible);

            if (candidate) {
                return candidate.closest("button, a") || candidate;
            }
        }

        const textCandidate = Array.from(
            document.querySelectorAll("button, a, button span, a span, button *, a *")
        )
            .filter(isVisible)
            .find(element => {
                const text = normalize(element.innerText || element.textContent);
                const aria = normalize(element.getAttribute?.("aria-label"));
                const href = normalize(element.getAttribute?.("href"));

                return (
                    text.includes("add more skills") ||
                    text.includes("add skill") ||
                    text.includes("add a skill") ||
                    aria.includes("add more skills") ||
                    aria.includes("add skill") ||
                    aria.includes("add a skill") ||
                    text.includes("kenntnis hinzufügen") ||
                    aria.includes("kenntnis hinzufügen") ||
                    href.includes("/skills/edit/forms/new/") ||
                    href.includes("/details/skills/edit/forms/new/")
                );
            });

        if (textCandidate) {
            return textCandidate.closest("button, a") || textCandidate;
        }

        const addIcon = Array.from(document.querySelectorAll("svg#add-medium, svg[id*='add']"))
            .find(isVisible);

        if (addIcon) {
            return addIcon.closest("button, a");
        }

        return null;
    }

    // Target: Wait for skill input in add modal/page.
    async function waitForSkillInput() {
        return waitForCondition(() => {
            const selectors = [
                'input[data-testid="typeahead-input"]',
                'input[aria-label="Skill*"]',
                'input[placeholder*="Skill"]',
                'input[placeholder*="Project Management"]',
                'input[aria-autocomplete="list"]'
            ];

            for (const selector of selectors) {
                const input = Array.from(document.querySelectorAll(selector))
                    .find(isVisible);

                if (input) return input;
            }

            return null;
        }, config.elementWaitTimeoutMs);
    }

    // Target: Set value in React-controlled input.
    function setNativeInputValue(input, value) {
        const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
        )?.set;

        if (setter) {
            setter.call(input, value);
        } else {
            input.value = value;
        }

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Target: Enter skill text into input.
    async function enterSkill(input, skillName) {
        input.focus();

        setNativeInputValue(input, "");
        await wait(200);

        setNativeInputValue(input, skillName);

        input.dispatchEvent(new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: skillName.slice(-1) || " "
        }));

        input.dispatchEvent(new KeyboardEvent("keyup", {
            bubbles: true,
            cancelable: true,
            key: skillName.slice(-1) || " "
        }));

        await wait(config.waitAfterTypingMs);
    }

    // Target: Find matching LinkedIn typeahead suggestion.
    function findSkillSuggestion(skillName) {
        const normalizedSkill = normalize(skillName);

        const candidates = Array.from(document.querySelectorAll(
            [
                '[role="option"]',
                '[role="listbox"] *',
                'li',
                'button',
                'div'
            ].join(",")
        ))
            .filter(isVisible)
            .filter(element => {
                const text = normalize(element.innerText || element.textContent);
                return text && text.includes(normalizedSkill);
            });

        const exact = candidates.find(element =>
            normalize(element.innerText || element.textContent) === normalizedSkill
        );

        return exact || candidates[0] || null;
    }

    // Target: Select matching typeahead suggestion if available.
    async function selectSuggestionIfAvailable(skillName) {
        const suggestion = await waitForCondition(() => {
            return findSkillSuggestion(skillName);
        }, 5000, 250);

        if (!suggestion) {
            console.warn(`No typeahead suggestion found for: ${skillName}. Trying Save anyway.`);
            return false;
        }

        const clickable = suggestion.closest("button, [role='option'], li, div") || suggestion;

        clickElement(clickable);

        console.log(`Selected suggestion for: ${skillName}`);
        await wait(config.waitAfterSuggestionClickMs);

        return true;
    }

    // Target: Find enabled Save button.
    function findSaveButton() {
        const buttons = Array.from(document.querySelectorAll("button"))
            .filter(isVisible);

        return buttons.find(button => {
            const text = normalize(button.innerText || button.textContent);
            const aria = normalize(button.getAttribute("aria-label"));
            const disabled =
                button.disabled ||
                button.getAttribute("aria-disabled") === "true";

            if (disabled) return false;

            return (
                text === "save" ||
                aria === "save" ||
                text === "speichern" ||
                aria === "speichern"
            );
        }) || null;
    }

    // Target: Wait for enabled Save button.
    async function waitForSaveButton() {
        return waitForCondition(() => {
            return findSaveButton();
        }, config.elementWaitTimeoutMs);
    }

    /******************************************************************
     * COMPLETION DETECTION
     ******************************************************************/

    // Target: Detect success toast after adding.
    function successToastExists() {
        const toastCandidates = Array.from(document.querySelectorAll(
            [
                'div[data-test-artdeco-toast-item-type="success"]',
                ".artdeco-toast-item",
                '[role="alert"]'
            ].join(",")
        ));

        return toastCandidates.some(toast => {
            const text = normalize(toast.textContent || toast.innerText);

            return (
                text.includes("saved") ||
                text.includes("added") ||
                text.includes("successful") ||
                text.includes("gespeichert") ||
                text.includes("hinzugefügt") ||
                text.includes("erfolgreich")
            );
        });
    }

    // Target: Check whether Add skill UI is still open.
    function addUiStillOpen() {
        const input = document.querySelector(
            'input[data-testid="typeahead-input"], input[aria-label="Skill*"], input[aria-autocomplete="list"]'
        );

        const saveButton = findSaveButton();

        return Boolean((input && isVisible(input)) || saveButton);
    }

    // Target: Wait until add/save flow appears complete.
    async function waitForAddCompletion(skillName) {
        return waitForCondition(() => {
            if (successToastExists()) {
                return true;
            }

            if (findAddMoreSkillsButton()) {
                return true;
            }

            if (findNoThanksButton()) {
                return true;
            }

            if (!addUiStillOpen()) {
                return true;
            }

            if (skillAlreadyExists(skillName)) {
                return true;
            }

            return null;
        }, config.saveCompletionTimeoutMs);
    }

    /******************************************************************
     * ADD FLOW
     ******************************************************************/

    // Target: Open Add skill dialog or post-save Add more skills flow.
    async function openAddSkillDialog(skillName) {
        const addMoreButton = findAddMoreSkillsButton();

        console.log(
            addMoreButton
                ? `Opening Add more skills flow for: ${skillName}`
                : `Opening Add skill dialog for: ${skillName}`
        );

        const addButton = addMoreButton || findAddSkillButton();

        if (!addButton) {
            logAdd(skillName, "FAILED", "Could not find Add skill / Add more skills button.");
            return false;
        }

        if (!config.dryRun) {
            clickElement(addButton);
        }

        await wait(
            addMoreButton
                ? config.waitAfterAddMoreClickMs
                : config.waitAfterAddClickMs
        );

        if (config.dryRun) {
            return true;
        }

        const input = await waitForSkillInput();

        if (!input) {
            logAdd(skillName, "FAILED", "Skill input was not detected after opening add flow.");
            return false;
        }

        return true;
    }

    // Target: Add one skill from selected profile.
    async function addSkill(skillName) {
        if (config.skipExistingSkills && skillAlreadyExists(skillName)) {
            logAdd(skillName, "SKIPPED", "Skill already exists on the visible Skills page.");
            return true;
        }

        if (config.dryRun) {
            logAdd(skillName, "DRY_RUN", "Skill would be added, but dryRun is enabled.");
            return true;
        }

        const opened = await openAddSkillDialog(skillName);

        if (!opened) {
            return false;
        }

        const input = await waitForSkillInput();

        if (!input) {
            logAdd(skillName, "FAILED", "Could not find skill input.");
            return false;
        }

        console.log(`Entering skill: ${skillName}`);
        await enterSkill(input, skillName);

        await selectSuggestionIfAvailable(skillName);

        const saveButton = await waitForSaveButton();

        if (!saveButton) {
            logAdd(skillName, "FAILED", "Could not find enabled Save button.");
            return false;
        }

        console.log(`Saving skill: ${skillName}`);
        clickElement(saveButton);

        await wait(config.waitAfterSaveClickMs);

        const completed = await waitForAddCompletion(skillName);

        if (!completed) {
            logAdd(skillName, "FAILED", "Save completion was not detected.");
            return false;
        }

        logAdd(skillName, "ADDED", "Skill saved successfully; next-step modal detected or save flow completed.");
        return true;
    }

    /******************************************************************
     * MAIN LOOP
     ******************************************************************/

    // Target: Add all skills from chosen profile.
    async function runProcess(options = {}) {
        const {
            profile = "productOwner",
            dryRun = true,
            overrides = {}
        } = options;

        selectedSkillProfile = profile;
        skillsToAdd = skillProfiles[selectedSkillProfile];

        if (!skillsToAdd) {
            throw new Error(
                `Invalid profile: "${selectedSkillProfile}". ` +
                `Use one of: ${Object.keys(skillProfiles).join(", ")}`
            );
        }

        config = {
            ...defaultConfig,
            ...overrides,
            dryRun
        };

        console.log(`Selected skill profile: ${selectedSkillProfile}`);
        console.log(`Dry run: ${config.dryRun}`);
        console.table(skillsToAdd);

        let addedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        let cycle = 0;

        for (let index = 0; index < skillsToAdd.length; index++) {
            const skillName = skillsToAdd[index];
            const isLastSkill = index === skillsToAdd.length - 1;

            if (!isCurrentRun()) {
                console.warn("Stopped because stopLinkedInSkillAdder() was called.");
                return;
            }

            cycle++;

            if (cycle > config.maxCycles) {
                console.warn(`Stopped after maxCycles=${config.maxCycles}.`);
                break;
            }

            const success = await addSkill(skillName);
            const lastEntry = addLog[addLog.length - 1];

            if (lastEntry?.status === "ADDED") {
                addedCount++;
            }

            if (lastEntry?.status === "SKIPPED") {
                skippedCount++;
            }

            if (!success || lastEntry?.status === "FAILED") {
                failedCount++;
                console.warn(`Stopped because adding failed for: ${skillName}`);
                break;
            }

            if (isLastSkill && !config.dryRun && failedCount === 0) {
                await clickNoThanksIfPresent();
            }

            await wait(config.waitBetweenSkillsMs);
        }

        if (!config.dryRun && failedCount === 0 && isCurrentRun()) {
            await clickNoThanksIfPresent();
        }

        console.log(
            `%cFinished%c\nProfile: ${selectedSkillProfile}\nDry run: ${config.dryRun}\nAdded: ${addedCount}\nSkipped: ${skippedCount}\nFailed: ${failedCount}`,
            "background:#222;color:#bada55;font-size:18px;font-weight:bold;",
            "background:#fff;color:#000;font-size:14px;"
        );

        console.log("%cAdd skills summary:", "font-weight:bold;font-size:16px;");
        console.table(addLog);
    }

    /******************************************************************
     * EXECUTE
     ******************************************************************/

    await runProcess({
        profile: "productOwner",      // "productOwner" or "azureAIEngineer"
        dryRun: true,                 // true = test only, false = actually add skills

        overrides: {
            skipExistingSkills: true

            // Optional:
            // waitAfterTypingMs: 1500,
            // elementWaitTimeoutMs: 30000,
            // waitAfterAddMoreClickMs: 1500,
            // waitAfterNoThanksClickMs: 1500
        }
    });
})();
