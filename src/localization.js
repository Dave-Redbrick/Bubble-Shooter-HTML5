const translations = {
    // General
    "gameTitle": "Bubble Shooter",
    "score": "Score",
    "highScore": "High Score",
    "level": "Level",
    "confirm": "Confirm",
    "close": "Close",
    "reset": "Reset",
    "save": "Save",
    "ad": "AD",
    "cancel": "Cancel",
    "menu": "MENU",
    "chances": "CHANCES",
    "help": "HELP",
    "helpLine1": "Aim with the mouse and click to shoot.",
    "helpLine2": "Match 3 or more bubbles of the same color to pop them.",
    "helpLine3": "Clear all bubbles to advance to the next level.",

    // Items
    "itemAim": "AIM",
    "itemBomb": "BOMB",
    "itemAimActive": "AIM\nACTIVE",
    "itemAimTitle": "Aim Guide",
    "itemAimDescription": "Shows the exact path of the bubble for a short time. Watch an ad to get this item?",
    "itemBombTitle": "Bomb Bubble",
    "itemBombDescription": "Changes the current bubble into a powerful bomb. The bomb will destroy nearby bubbles. Watch an ad to get this item?",

    // Settings
    "settings": "Settings",
    "sound": "Sound",
    "masterVolume": "Master Volume",
    "sfxVolume": "SFX Volume",
    "graphics": "Graphics",
    "particleQuality": "Particle Quality",
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "screenShake": "Screen Shake",
    "showFPS": "Show FPS",
    "accessibility": "Accessibility",
    "colorBlindMode": "Colorblind Mode",
    "showTrajectory": "Show Trajectory",

    // Game Over
    "gameOver": "Game Over!",
    "clickToRestart": "Click to restart",
    "finalScore": "Final Score: {score}",
    "newHighScore": "🏆 New High Score! 🏆",

    // Daily Challenge
    "newDailyChallenge": "New Daily Challenge!",
    "checkTodaysChallenge": "Check out today's challenge",

    // Menu
    "continue": "Continue",
    "newGame": "New Game",
    "statistics": "Statistics",
    "achievements": "Achievements",
    "leaderboard": "Leaderboard",

    // Ad placeholder
    "adPlaceholder": "Ad (demo) completed successfully!",

    // score to next level
    "scoreToNextLevel": "Next level in {score} points"
};

export function getLocalizedString(key, replacements = {}) {
    let text = translations[key] || key;
    for (const placeholder in replacements) {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return text;
}
