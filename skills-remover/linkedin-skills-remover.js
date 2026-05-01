(async () => {
    /******************************************************************
     * LINKEDIN SKILL CLEANUP
     * Target: Skills page -> click pencil -> click Delete skill -> confirm
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

    // Target: Select which skill profile should be kept.
    const selectedSkillProfile = "productOwner"; // "productOwner" or "azureAIEngineer"

    const config = {
        // Target: Set true for testing, false for real deletion.
        dryRun: false,

        maxCycles: 200,

        waitAfterEditClickMs: 1500,
        waitAfterDeleteSkillClickMs: 1000,
        waitAfterConfirmDeleteMs: 1800,
        waitBetweenSkillsMs: 1500,

        elementWaitTimeoutMs: 20000,
        deletionWaitTimeoutMs: 30000,

        autoScrollForMoreSkills: true,

        // Target: Prevent deleting skills when the skill name cannot be detected.
        deleteUnknownSkills: false
    };

    const skillsToKeep = skillProfiles[selectedSkillProfile];

    if (!skillsToKeep) {
        throw new Error(
            `Invalid selectedSkillProfile: "${selectedSkillProfile}". ` +
            `Use one of: ${Object.keys(skillProfiles).join(", ")}`
        );
    }

    const runId = Date.now();
    window.__linkedinSkillCleanupRunId = runId;

    // Target: Check whether this script run is still the active run.
    function isCurrentRun() {
        return window.__linkedinSkillCleanupRunId === runId;
    }

    // Target: Allow manual stop from console via stopLinkedInSkillCleanup().
    window.stopLinkedInSkillCleanup = function stopLinkedInSkillCleanup() {
        window.__linkedinSkillCleanupRunId = null;
        console.warn("LinkedIn skill cleanup stopped.");
    };

    // Target: Normalize strings for reliable comparison.
    function normalize(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    const keepSkillsNormalized = new Set(skillsToKeep.map(normalize));

    const deletionLog = [];
    window.linkedinSkillCleanupDeletionLog = deletionLog;

    // Target: Log each deletion attempt/result to the console.
    function logDeletion(skillName, status, details = "") {
        const entry = {
            index: deletionLog.length + 1,
            timestamp: new Date().toISOString(),
            skill: skillName,
            status,
            details
        };

        deletionLog.push(entry);

        console.log(
            `%c[LinkedIn Skill Cleanup]%c ${status}: ${skillName}`,
            "background:#222;color:#bada55;font-weight:bold;padding:2px 4px;",
            "color:#000;font-weight:bold;"
        );

        if (details) {
            console.log(`Details: ${details}`);
        }

        console.table(deletionLog);

        return entry;
    }

    // Target: Pause execution for a given number of milliseconds.
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Target: Check whether an element is visible and clickable.
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

    // Target: Decide whether a skill should be kept.
    function shouldKeepSkill(skillName) {
        return keepSkillsNormalized.has(normalize(skillName));
    }

    // Target: Click an element using mouse events plus native click.
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

    // Target: Wait until a DOM condition becomes true.
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

    /******************************************************************
     * FIND SKILL EDIT / PENCIL LINKS
     ******************************************************************/

    // Target: Extract skill name from edit button/link attributes.
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

    // Target: Extract skill name from the surrounding skill row.
    function findSkillNameFromNearbyRow(editElement) {
        const row =
            editElement.closest("li") ||
            editElement.closest(".pvs-list__paged-list-item") ||
            editElement.closest(".artdeco-list__item") ||
            editElement.closest("[data-view-name]") ||
            editElement.parentElement;

        if (!row) return null;

        const rawText = row.innerText || row.textContent || "";

        const lines = rawText
            .split("\n")
            .map(line => line.replace(/\s+/g, " ").trim())
            .filter(Boolean);

        const badLinePattern =
            /experience|experiences|company|companies|endorsement|endorsements|edit|skill|kenntnis|bearbeiten|show all|anzeigen/i;

        return lines.find(line => !badLinePattern.test(line)) || null;
    }

    // Target: Find all visible LinkedIn skill edit/pencil elements.
    function findSkillEditElements() {
        const selector = [
            'a[href*="/details/skills/edit/forms/"]',
            'button[aria-label^="Edit "][aria-label*=" skill"]',
            'a[aria-label^="Edit "][aria-label*=" skill"]',
            'button[aria-label*="Edit"][aria-label*="skill"]',
            'a[aria-label*="Edit"][aria-label*="skill"]',
            'button[aria-label*="Bearbeiten"]',
            'a[aria-label*="Bearbeiten"]'
        ].join(",");

        const elements = Array.from(document.querySelectorAll(selector))
            .filter(isVisible);

        return elements.map(element => {
            const skillName =
                parseSkillNameFromEditElement(element) ||
                findSkillNameFromNearbyRow(element);

            return {
                element,
                skillName
            };
        });
    }

    // Target: Find the next skill that is not in the keep-list.
    function findNextDeletableSkillEditElement() {
        const editItems = findSkillEditElements();

        for (const item of editItems) {
            const skillName = item.skillName;

            if (skillName && shouldKeepSkill(skillName)) {
                console.log(`Keeping skill: ${skillName}`);
                continue;
            }

            if (!skillName && !config.deleteUnknownSkills) {
                console.warn("Skipping skill because its name could not be detected.", item.element);
                continue;
            }

            return item;
        }

        return null;
    }

    /******************************************************************
     * FIND MODAL / BUTTONS
     ******************************************************************/

    // Target: Find visible LinkedIn modal/dialog containers.
    function getVisibleDialogs() {
        return Array.from(
            document.querySelectorAll('[role="dialog"], .artdeco-modal, div[class*="modal"]')
        ).filter(isVisible);
    }

    // Target: Find a visible button by text, aria-label, or title.
    function findButtonByText(textMatchers, options = {}) {
        const {
            root = document,
            exactOnly = false,
            excludeTexts = []
        } = options;

        const normalizedMatchers = textMatchers.map(normalize);
        const normalizedExclusions = excludeTexts.map(normalize);

        const candidates = Array.from(
            root.querySelectorAll("button, button span, button *")
        );

        for (const candidate of candidates) {
            const text = normalize(candidate.textContent || candidate.innerText || "");
            const aria = normalize(candidate.getAttribute?.("aria-label"));
            const title = normalize(candidate.getAttribute?.("title"));

            const values = [text, aria, title].filter(Boolean);

            const excluded = values.some(value =>
                normalizedExclusions.some(exclusion =>
                    value === exclusion || value.includes(exclusion)
                )
            );

            if (excluded) continue;

            const matches = values.some(value =>
                normalizedMatchers.some(match =>
                    exactOnly
                        ? value === match
                        : value === match || value.includes(match)
                )
            );

            if (!matches) continue;

            const button = candidate.closest("button");

            if (button && isVisible(button)) {
                return button;
            }
        }

        return null;
    }

    // Target: Wait for the "Delete skill" button in the skill edit UI.
    async function waitForDeleteSkillButton() {
        return waitForCondition(() => {
            return findButtonByText([
                "Delete skill",
                "Skill löschen",
                "Kenntnis löschen",
                "Fähigkeit löschen",
                "Kompetenz löschen"
            ], {
                root: document
            });
        }, config.elementWaitTimeoutMs);
    }

    // Target: Wait for the final confirmation "Delete" button.
    async function waitForFinalDeleteButton() {
        return waitForCondition(() => {
            return findButtonByText(
                ["Delete", "Löschen"],
                {
                    root: document,
                    exactOnly: true,
                    excludeTexts: [
                        "Delete skill",
                        "Skill löschen",
                        "Kenntnis löschen",
                        "Fähigkeit löschen",
                        "Kompetenz löschen"
                    ]
                }
            );
        }, config.elementWaitTimeoutMs);
    }

    // Target: Detect whether the edit UI has opened successfully.
    async function waitForEditUi(skillName) {
        return waitForCondition(() => {
            const deleteSkillButton = findButtonByText([
                "Delete skill",
                "Skill löschen",
                "Kenntnis löschen",
                "Fähigkeit löschen",
                "Kompetenz löschen"
            ], {
                root: document
            });

            if (deleteSkillButton) return true;

            const pageText = normalize(document.body.innerText || document.body.textContent || "");
            const normalizedSkillName = normalize(skillName || "");

            const urlLooksLikeEditForm =
                location.href.includes("/details/skills/edit/forms/") ||
                location.href.includes("/skills/edit/forms/");

            const pageLooksLikeEditForm =
                pageText.includes("delete skill") ||
                pageText.includes("skill löschen") ||
                pageText.includes("kenntnis löschen") ||
                pageText.includes("save") ||
                pageText.includes("speichern") ||
                Boolean(normalizedSkillName && pageText.includes(normalizedSkillName));

            if (urlLooksLikeEditForm && pageLooksLikeEditForm) {
                return true;
            }

            return null;
        }, config.elementWaitTimeoutMs);
    }

    /******************************************************************
     * DETECT DELETION COMPLETION
     ******************************************************************/

    // Target: Check whether a skill edit link still exists on the page.
    function skillStillExistsOnPage(skillName) {
        const normalizedSkill = normalize(skillName);

        return findSkillEditElements().some(item =>
            normalize(item.skillName) === normalizedSkill
        );
    }

    // Target: Detect LinkedIn success toast after deletion.
    function successToastExists() {
        const toastCandidates = Array.from(
            document.querySelectorAll(
                [
                    'div[data-test-artdeco-toast-item-type="success"]',
                    ".artdeco-toast-item",
                    '[role="alert"]'
                ].join(",")
            )
        );

        return toastCandidates.some(toast => {
            const text = normalize(toast.textContent || toast.innerText);

            return (
                text.includes("deleted") ||
                text.includes("deletion") ||
                text.includes("successful") ||
                text.includes("deletion was successful") ||
                text.includes("gelöscht") ||
                text.includes("erfolgreich")
            );
        });
    }

    // Target: Check whether delete-related UI is still open.
    function deleteUiStillOpen() {
        const deleteSkillButton = findButtonByText([
            "Delete skill",
            "Skill löschen",
            "Kenntnis löschen",
            "Fähigkeit löschen",
            "Kompetenz löschen"
        ], {
            root: document
        });

        const finalDeleteButton = findButtonByText(
            ["Delete", "Löschen"],
            {
                root: document,
                exactOnly: true,
                excludeTexts: [
                    "Delete skill",
                    "Skill löschen",
                    "Kenntnis löschen",
                    "Fähigkeit löschen",
                    "Kompetenz löschen"
                ]
            }
        );

        return Boolean(deleteSkillButton || finalDeleteButton);
    }

    // Target: Wait until deletion is confirmed by toast or disappearance.
    async function waitForDeletionCompletion(skillName) {
        return waitForCondition(() => {
            if (successToastExists()) {
                return true;
            }

            const dialogs = getVisibleDialogs();

            const deleteDialogOpen = dialogs.some(dialog => {
                const text = normalize(dialog.innerText || dialog.textContent);
                return text.includes("delete") || text.includes("löschen");
            });

            if (!deleteDialogOpen && !deleteUiStillOpen() && !skillStillExistsOnPage(skillName)) {
                return true;
            }

            return null;
        }, config.deletionWaitTimeoutMs);
    }

    /******************************************************************
     * OPEN, DELETE, CONFIRM
     ******************************************************************/

    // Target: Open the skill editor by clicking the pencil/edit icon.
    async function openSkillEditor(skillItem) {
        const { element, skillName } = skillItem;

        console.log(`Opening editor for skill: ${skillName || "UNKNOWN SKILL"}`);

        if (!config.dryRun) {
            clickElement(element);
        }

        await wait(config.waitAfterEditClickMs);

        if (config.dryRun) {
            return true;
        }

        const editUiReady = await waitForEditUi(skillName || "");

        if (!editUiReady) {
            logDeletion(
                skillName,
                "FAILED",
                "Edit UI was not detected after clicking the pencil/edit button."
            );
            return false;
        }

        console.log(`Edit UI detected for: ${skillName}`);
        return true;
    }

    // Target: Execute delete flow for the currently opened skill editor.
    async function deleteCurrentSkill(skillName) {
        console.log(`Starting deletion flow for: ${skillName}`);

        const deleteSkillButton = await waitForDeleteSkillButton();

        if (!deleteSkillButton) {
            logDeletion(skillName, "FAILED", 'Could not find "Delete skill" button.');
            return false;
        }

        console.log(`Clicking "Delete skill" for: ${skillName}`);

        if (!config.dryRun) {
            clickElement(deleteSkillButton);
        }

        await wait(config.waitAfterDeleteSkillClickMs);

        const finalDeleteButton = await waitForFinalDeleteButton();

        if (finalDeleteButton) {
            console.log(`Confirming deletion for: ${skillName}`);

            if (!config.dryRun) {
                clickElement(finalDeleteButton);
            }

            await wait(config.waitAfterConfirmDeleteMs);
        } else {
            console.warn(
                `No final confirmation button found for: ${skillName}. Checking if deletion completed anyway.`
            );
        }

        if (config.dryRun) {
            logDeletion(
                skillName,
                "DRY_RUN",
                "Skill would be deleted, but dryRun is enabled."
            );
            return true;
        }

        const deletionCompleted = await waitForDeletionCompletion(skillName);

        if (!deletionCompleted) {
            logDeletion(
                skillName,
                "FAILED",
                "Deletion completion was not detected."
            );
            return false;
        }

        logDeletion(
            skillName,
            "DELETED",
            "Skill deleted successfully or no longer visible on page."
        );

        return true;
    }

    /******************************************************************
     * SCROLL SUPPORT
     ******************************************************************/

    // Target: Scroll down to load more skills if LinkedIn paginates/lazy-loads.
    async function scrollForMoreSkills(previousEditCount) {
        if (!config.autoScrollForMoreSkills) return false;

        const oldScrollY = window.scrollY;

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
        });

        await wait(1800);

        const newEditCount = findSkillEditElements().length;
        const newScrollY = window.scrollY;

        return newEditCount > previousEditCount || newScrollY > oldScrollY;
    }

    /******************************************************************
     * MAIN LOOP
     ******************************************************************/

    // Target: Main controller loop for finding and deleting skills.
    async function runProcess() {
        console.log(`Selected skill profile: ${selectedSkillProfile}`);
        console.log(`Dry run: ${config.dryRun}`);
        console.table(skillsToKeep);

        let deletedCount = 0;
        let cycle = 0;
        let noCandidatePasses = 0;

        while (isCurrentRun() && cycle < config.maxCycles) {
            cycle++;

            const editCountBefore = findSkillEditElements().length;
            const nextSkill = findNextDeletableSkillEditElement();

            if (!nextSkill) {
                noCandidatePasses++;

                const foundMore = await scrollForMoreSkills(editCountBefore);

                if (foundMore && noCandidatePasses < 3) {
                    continue;
                }

                console.log(
                    `%cFinished%c\nNo more non-kept skills found.\nDeleted: ${deletedCount}\nProfile: ${selectedSkillProfile}`,
                    "background:#222;color:#bada55;font-size:18px;font-weight:bold;",
                    "background:#fff;color:#000;font-size:14px;"
                );

                console.log("%cDeleted skills summary:", "font-weight:bold;font-size:16px;");
                console.table(deletionLog);

                return;
            }

            noCandidatePasses = 0;

            const skillName = nextSkill.skillName || "UNKNOWN SKILL";

            if (config.dryRun) {
                console.log(`[DRY RUN] Would delete: ${skillName}`);
                logDeletion(
                    skillName,
                    "DRY_RUN",
                    "First deletable skill found. Set dryRun:false to actually delete."
                );
                console.log("Dry run stopped after first deletable skill.");
                return;
            }

            const opened = await openSkillEditor(nextSkill);

            if (!opened) {
                console.warn(`Stopped because editor could not be opened for: ${skillName}`);
                return;
            }

            const deleted = await deleteCurrentSkill(skillName);

            if (!deleted) {
                console.warn(`Stopped because deletion failed for: ${skillName}`);
                return;
            }

            deletedCount++;

            await wait(config.waitBetweenSkillsMs);
        }

        if (!isCurrentRun()) {
            console.warn("Stopped because a newer run was started or stopLinkedInSkillCleanup() was called.");
            return;
        }

        console.warn(`Stopped after maxCycles=${config.maxCycles}. Deleted ${deletedCount} skill(s).`);
        console.table(deletionLog);
    }

    await runProcess();
})();
