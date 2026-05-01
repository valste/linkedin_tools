const skillsToKeep = [
    "Project Management",
    "Portfolio Management",
    "Power BI",
    "JIRA",
    "Confluence",
    "SharePoint",
    "SQL"
];

const config = {
    skillsEditorSelector: "#navigation-add-edit-deeplink-edit-skills",
    successToastSelector: 'div[data-test-artdeco-toast-item-type="success"] p.artdeco-toast-item__message',
    successToastText: "Deletion was successful.",
    emptyStateSelector: "section.full-width.artdeco-empty-state",

    maxOpenAttempts: 5,
    attemptDelayMs: 1000,
    afterOpenDelayMs: 1500,
    afterDeleteClickDelayMs: 1000,
    successTimeoutMs: 30000,

    // Safer default: do not delete if the script cannot read the skill name.
    deleteUnknownSkills: false
};

const keepSkillsNormalized = new Set(skillsToKeep.map(normalizeSkill));

function normalizeSkill(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldKeepSkill(skillName) {
    return keepSkillsNormalized.has(normalizeSkill(skillName));
}

function getCleanText(element) {
    return element?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function isBadSkillCandidate(text) {
    const normalized = normalizeSkill(text);

    if (!normalized) return true;

    const blockedExactValues = new Set([
        "delete",
        "delete skill",
        "edit",
        "edit skill",
        "save",
        "cancel",
        "back",
        "close",
        "done",
        "add skill"
    ]);

    if (blockedExactValues.has(normalized)) return true;
    if (normalized.length > 100) return true;

    return /\b(endorsement|endorsed|people|connections|followers|recommendations?)\b/i.test(text);
}

function isDeleteSkillButton(button) {
    const text = normalizeSkill(button.textContent);
    const ariaLabel = normalizeSkill(button.getAttribute("aria-label"));
    const title = normalizeSkill(button.getAttribute("title"));

    return (
        text === "delete skill" ||
        ariaLabel === "delete skill" ||
        ariaLabel.startsWith("delete ") ||
        title === "delete skill"
    );
}

function extractSkillNameFromButtonAttributes(button) {
    const attributes = [
        button.getAttribute("aria-label"),
        button.getAttribute("title")
    ].filter(Boolean);

    const patterns = [
        /^delete skill[:\-]?\s+(.+)$/i,
        /^delete\s+(.+?)\s+skill$/i,
        /^delete\s+(.+)$/i
    ];

    for (const attribute of attributes) {
        for (const pattern of patterns) {
            const match = attribute.match(pattern);
            if (match && match[1] && !isBadSkillCandidate(match[1])) {
                return match[1].trim();
            }
        }
    }

    return null;
}

function findSkillContainer(button) {
    return (
        button.closest("li") ||
        button.closest(".artdeco-list__item") ||
        button.closest(".pvs-list__paged-list-item") ||
        button.closest(".pvs-entity") ||
        button.closest('div[data-view-name*="profile-component-entity"]') ||
        button.closest("form") ||
        null
    );
}

function extractSkillNameFromForm(button) {
    const form = button.closest("form");
    if (!form) return null;

    const fields = Array.from(form.querySelectorAll("input, textarea"));

    for (const field of fields) {
        const value = field.value?.trim();
        if (value && !isBadSkillCandidate(value)) {
            return value;
        }
    }

    return null;
}

function extractSkillNameFromContainer(button) {
    const container = findSkillContainer(button);
    if (!container) return null;

    const candidateSelectors = [
        'span[aria-hidden="true"]',
        ".t-bold span",
        "strong",
        "h1",
        "h2",
        "h3",
        "h4",
        "span"
    ];

    for (const selector of candidateSelectors) {
        const candidates = Array.from(container.querySelectorAll(selector));

        for (const candidate of candidates) {
            if (button.contains(candidate)) continue;

            const text = getCleanText(candidate);

            if (text && !isBadSkillCandidate(text)) {
                return text;
            }
        }
    }

    return null;
}

function getSkillNameForDeleteButton(button) {
    return (
        extractSkillNameFromButtonAttributes(button) ||
        extractSkillNameFromForm(button) ||
        extractSkillNameFromContainer(button)
    );
}

function displayThankYouMessage(reason) {
    console.log(
        "%c Thank you for using the script! %c\n\n" +
        `${reason}\n` +
        "You can visit github.com/hv33y for more useful scripts.\n\n" +
        "Have a great day!",
        "background: #222; color: #bada55; font-size: 20px; font-weight: bold;",
        "background: #fff; color: #000; font-size: 16px;"
    );
}

function checkForEmptyState() {
    const emptyState = document.querySelector(config.emptyStateSelector);

    if (
        emptyState &&
        emptyState.textContent.includes("When you add new skills they'll show up here")
    ) {
        displayThankYouMessage("All deletable skills have been removed.");
        return true;
    }

    return false;
}

async function openSkillsEditor() {
    for (let attempt = 1; attempt <= config.maxOpenAttempts; attempt++) {
        const firstButton = document.querySelector(config.skillsEditorSelector);

        if (firstButton) {
            firstButton.click();
            console.log(`Skills editor opened. Attempt ${attempt}.`);
            return true;
        }

        console.log(
            `Button '${config.skillsEditorSelector}' not found. Attempt ${attempt} of ${config.maxOpenAttempts}.`
        );

        await wait(config.attemptDelayMs);
    }

    displayThankYouMessage("The skills editor button could not be found after several attempts.");
    return false;
}

function clickNextDeletableSkillButton() {
    const deleteButtons = Array.from(document.querySelectorAll("button"))
        .filter(isDeleteSkillButton);

    if (!deleteButtons.length) {
        displayThankYouMessage("No 'Delete skill' buttons were found.");
        return null;
    }

    let keptCount = 0;
    let unknownCount = 0;

    for (const button of deleteButtons) {
        const skillName = getSkillNameForDeleteButton(button);

        if (skillName && shouldKeepSkill(skillName)) {
            keptCount++;
            console.log(`Keeping skill: ${skillName}`);
            continue;
        }

        if (!skillName && !config.deleteUnknownSkills) {
            unknownCount++;
            console.warn("Skipped one skill because its name could not be detected.", button);
            continue;
        }

        button.scrollIntoView({ block: "center", behavior: "auto" });
        button.click();

        const label = skillName || "UNKNOWN SKILL";
        console.log(`Delete skill button clicked for: ${label}`);

        return label;
    }

    displayThankYouMessage(
        `Finished. No more deletable non-kept skills found. Kept ${keptCount} skill(s).` +
        (unknownCount
            ? ` Skipped ${unknownCount} skill(s) because their names could not be detected.`
            : "")
    );

    return null;
}

async function clickFinalDeleteButton() {
    for (let attempt = 1; attempt <= 10; attempt++) {
        const finalDeleteButtons = Array.from(
            document.querySelectorAll(
                'button.artdeco-button--primary[data-test-dialog-primary-btn], button[data-test-dialog-primary-btn]'
            )
        );

        const finalDeleteButton = finalDeleteButtons.find(button =>
            normalizeSkill(button.textContent) === "delete"
        );

        if (finalDeleteButton) {
            finalDeleteButton.click();
            console.log("Final 'Delete' button clicked successfully.");
            return true;
        }

        await wait(500);
    }

    console.log("Final 'Delete' button not found.");
    return false;
}

function checkForSuccessMessage() {
    return new Promise(resolve => {
        let resolved = false;

        const finish = value => {
            if (resolved) return;
            resolved = true;
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve(value);
        };

        const checkInterval = setInterval(() => {
            const successMessage = document.querySelector(config.successToastSelector);

            if (
                successMessage &&
                successMessage.textContent.trim() === config.successToastText
            ) {
                console.log("Deletion success message detected.");
                finish(true);
            }
        }, 1000);

        const timeout = setTimeout(() => {
            console.log("Timeout: Success message not found within 30 seconds.");
            finish(false);
        }, config.successTimeoutMs);
    });
}

async function runProcess() {
    if (window.__linkedinSkillDeleteScriptRunning) {
        console.warn("Script is already running.");
        return;
    }

    window.__linkedinSkillDeleteScriptRunning = true;

    try {
        while (true) {
            if (checkForEmptyState()) {
                return;
            }

            const editorOpened = await openSkillsEditor();
            if (!editorOpened) {
                return;
            }

            await wait(config.afterOpenDelayMs);

            const skillBeingDeleted = clickNextDeletableSkillButton();
            if (!skillBeingDeleted) {
                return;
            }

            await wait(config.afterDeleteClickDelayMs);

            const finalDeleteClicked = await clickFinalDeleteButton();
            if (!finalDeleteClicked) {
                displayThankYouMessage("The final delete confirmation button could not be found.");
                return;
            }

            const success = await checkForSuccessMessage();

            if (!success) {
                displayThankYouMessage(
                    `Stopping the process because the success message was not detected after deleting: ${skillBeingDeleted}`
                );
                return;
            }

            console.log("Starting next deletion cycle...");
            await wait(config.attemptDelayMs);
        }
    } finally {
        window.__linkedinSkillDeleteScriptRunning = false;
    }
}

runProcess();
