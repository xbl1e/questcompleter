## <img alt="security icon" src="./assets/readme/security.svg" height="24" style="vertical-align: middle;"> Security Policy

> [!IMPORTANT]
> This document outlines the security practices and reporting guidelines for the QuestCompleter plugin.

### <img alt="notice icon" height="18" src="./assets/readme/notice.svg" style="vertical-align: middle;">&nbsp;&nbsp;Important Notice

> [!WARNING]
> QuestCompleter automates Discord Quest activity and may violate Discord's Terms of Service. That can result in account action, including termination. Use it strictly at your own risk and only after accepting the in-plugin consent prompt. The plugin does not start automation until that consent is enabled.

### <img alt="features icon" height="18" src="./assets/readme/features.svg" style="vertical-align: middle;">&nbsp;&nbsp;Supported Versions

Please use the latest version (`main` branch) to ensure you have the most up-to-date security patches. Older releases are not actively maintained.

### <img alt="documentation icon" height="18" src="./assets/readme/documentation.svg" style="vertical-align: middle;">&nbsp;&nbsp;Security & Privacy Model

The application is designed to process data locally and minimize data exposure:

1. **Local Processing:**
   All operations, state management, and modifications are processed locally within your Discord client. The plugin does not transmit your Discord token, telemetry, or personal data to any external central server or third-party analytics provider.
   
2. **Discord API Interaction:**
   The plugin directly interacts with Discord's internal API (`RestAPI`) and WebSocket connections using the client's existing authenticated session. No external network requests are made outside of `discord.com`.

3. **Risk Acknowledgement:**
   By automating API requests and spoofing game activity, this plugin inherently violates Discord's Terms of Service. Users assume all associated risks, including potential account termination, when using this software. This plugin should be used strictly for educational purposes and at your own risk.
