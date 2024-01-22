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
        ],
        [
            "semantic-release-slack-bot",
            {
                "notifyOnSuccess": false,
                "notifyOnFail": false,
                "slackWebhook": process.env.SLACK_WEBHOOK_URL,
                "onSuccessTemplate": {
                    "text": 
                    ":partying_face: *Meow-velous News, Team!* :paw_prints: \n"+
                    "Version *$npm_package_version* has just landed on our digital doorstep, "+
                    "and it's purr-fectly packed with features!\n\n :yasss_cat: \n\n"+
                    ":announcement: *A Paws-itive Reminder:*\n"+
                    "> Don't forget to update your systems! It's easier than herding cats,"+
                    "we promise. Just click on the update button, stretch back, and enjoy the "+
                    "seamless transition.\n\n*Happy Coding, Furr-iends!* "+
                    "Let's make some paw-some progress!\n\n"+
                    ":cat-roomba-exceptionally-fast: "+
                    "*Stay Pawsome!*\n :catjam: _Your Dev Team_ :catjam:"
                },
                "onFailTemplate": {
                    "text":
                    ":red_circle: *Attention Team: Paws for Thought!* :paw_prints:\n"+
                    "Our latest version *$npm_package_version* has encountered a hiccup,"+
                    " and it's not as purr-fect as we hoped.\n\n"+
                    ":toolbox: *What We're Doing:*\n- Assembling our team of "+
                    "Cat Coders to hunt down those pesky bugs.\n"+
                    "- Refining the 'cat-nip' module to ensure it's not too overwhelming.\n\n"+
                    " :announcement: *What You Can Do:*\n> Please hold off on updating your systems. "+
                    "We're herding these cats as fast as we can and will let you know the moment "+
                    "it's safe to pounce on the update button.\n\n*Thank You for Your Patience!* "+
                    "We're working hard to make things right and appreciate your support.\n\n"+
                    " :sob_cat: *Stay Tuned for Updates!*\n :catjam: _Your Dev Team_ :catjam:"
                },
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
        ]
    ]
};
  