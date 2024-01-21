module.exports = {
    "branches": [
        "main"
    ],
    "plugins": [
        [
            "@semantic-release/commit-analyzer",
            {
                "preset": "conventionalcommits"
            }
        ],
        "@semantic-release/release-notes-generator",
        [
            "semantic-release-vsce",
            {
                "packageVsix": true,
                "publish": false
            }
        ],
        [
            "semantic-release-slack-bot",
            {
                "notifyOnSuccess": false,
                "notifyOnFail": false,
                "slackWebhook": process.env.SLACK_WEBHOOK_URL,
                "branchesConfig": [
                    {
                        "pattern": "main",
                        "notifyOnSuccess": true,
                        "notifyOnFail": true
                    },
                    {
                        "pattern": "dev",
                        "notifyOnFail": true
                    }
                ]
            }
        ],
        "@semantic-release/changelog",
        [
            "@semantic-release/git",
            {
                "assets": [
                    "CHANGELOG.md",
                    "package.json",
                    "package-lock.json"
                ],
                "message": "chore(release): ${nextRelease.version} \n\n${nextRelease.notes}"
            }
        ],
        [
            "@semantic-release/github",
            {
                "assets": [
                    {
                        "path": "*.vsix"
                    }
                ]
            }
        ]
    ]
};
  