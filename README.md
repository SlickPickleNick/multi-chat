# SlickPickleNick Multichat Overlay

Version: `v0.1.11`

Compact OBS browser-source chat overlay for Twitch, YouTube, and Kick messages using Streamer.bot as the WebSocket bridge.

This version keeps the dashboard self-contained for easier editing while keeping the OBS overlay split into separate files.

## File structure

```text
index.html
README.md
overlay/
  overlay.html
  overlay.css
  overlay.js
```

## Current feature set

- Twitch, YouTube, and Kick platform toggles
- Streamer.bot WebSocket connection without required Streamer.bot actions or chat triggers
- Style dropdown with Standard Compact, Bubble Feed, and Stacked Cards layouts
- Optional profile image display
- Fallback user icon when no profile image URL is available
- Plain inline platform logo icons for Twitch, YouTube, and Kick indicators
- Optional platform icon display
- Optional 12-hour timestamp, such as `5:55 AM`
- Optional user badges
- Twitch Shared Chat badge support
- Optional message fade duration
- Max message count control
- Overlay width and height controls
- Default overlay size: `450 × 1080`
- Profile image size control
- Left overlay padding control, default `20px`
- Text shadow toggle
- Dashboard Preview/Live source switch
- Dashboard Zoomed/Scaled view switch, defaulting to Zoomed for easier editing
- Scaled preview view using a full `1920 × 1080` stream canvas
- Font family, font size, line height, and message gap controls
- Twitch native emote rendering when Streamer.bot provides emote data
- BTTV global emote support
- BTTV channel emote support by Twitch user ID
- FFZ global emote support
- FFZ room/channel emote support by channel name
- 7TV global emote support
- 7TV channel emote support by Twitch user ID
- Custom emote JSON map support
- GIF link display support
- GIF mod-only restriction option, enabled by default
- Deleted message handling
- Timeout/ban cleanup handling where platform event data is available
- Ignored user/bot list
- Ignore command messages option
- Preview mode with random fake users/messages
- Live preview mode with connection status from the overlay iframe
- Twitch announcement highlighting with bell icon and announcement-color styling

## GitHub Pages setup

1. Upload `index.html`, `README.md`, and the `overlay` folder to the GitHub repository.
2. Enable GitHub Pages for the repository.
3. Open the published `index.html` page in a browser.
4. Adjust the controls in the customization dashboard.
5. Copy the generated OBS Overlay Link.
6. Add a new OBS Browser Source.
7. Paste the generated URL into the Browser Source URL field.
8. Set the Browser Source size to the desired overlay area.

Recommended OBS Browser Source size:

- Width: `1920`
- Height: `1080`

The chat feed itself defaults to a `450px` width limit and `1080px` height limit inside that browser source. The overlay background is transparent unless preview mode is enabled.

## Streamer.bot setup

This overlay listens directly to Streamer.bot WebSocket events. It does not require separate Streamer.bot actions or chat triggers for each platform.

1. Open Streamer.bot.
2. Open the WebSocket Server settings.
3. Enable the WebSocket Server.
4. Enable Auto Start if desired.
5. Confirm the host and port.
   - Default host: `127.0.0.1`
   - Default port: `8080`
6. Connect Twitch, YouTube, and Kick accounts inside Streamer.bot as needed.
7. In the overlay customization dashboard, make sure the WebSocket host, port, endpoint, and scheme match Streamer.bot.

## WebSocket notes

The overlay connects to the Streamer.bot WebSocket Server, requests the available event list, then subscribes only to supported chat/moderation events.

Primary chat events used:

- `Twitch.ChatMessage`
- `YouTube.Message`
- `Kick.ChatMessage`

Additional cleanup events are requested when available, including deleted-message, timeout, ban, and chat-clear events.

## Authentication

Streamer.bot WebSocket authentication is optional.

If authentication is enabled in Streamer.bot, enter the WebSocket password in the dashboard. The overlay uses the Streamer.bot WebSocket authentication handshake in-browser.

Important: because this is a static GitHub Pages overlay, the password becomes part of the generated OBS URL. For local OBS use, the simpler approach is to keep the WebSocket Server bound to localhost and avoid exposing the WebSocket port publicly.

## Emote setup

### Twitch native emotes

Twitch native emotes render when Streamer.bot includes native emote data in the WebSocket payload.

### BTTV

Global BTTV emotes are loaded automatically when BTTV is enabled.

For channel BTTV emotes, enter the Twitch user ID in the `BTTV Twitch user ID` field.

### FFZ

Global FFZ emotes are loaded automatically when FFZ is enabled.

For channel FFZ emotes, enter the channel name in the `FFZ room/channel` field.

### 7TV

Global 7TV emotes are loaded automatically when 7TV is enabled.

For channel 7TV emotes, enter the Twitch user ID in the `7TV Twitch user ID` field.

### Custom emote map

Custom emotes can be added with JSON:

```json
{
  "PickleHype": "https://example.com/PickleHype.webp",
  "PickleWave": "https://example.com/PickleWave.gif"
}
```

The message renderer replaces exact token matches with the matching emote image.

## GIF link support

When GIF support is enabled, direct `.gif` links in chat are shown as inline GIF previews.

When GIF mod-only mode is enabled, GIF previews only display for users detected as moderators, broadcasters, staff, or equivalent role/badge holders. Other GIF links display as hidden fallback text.

## Preview and live mode

The dashboard preview iframe can run in two modes. Preview mode loads `overlay/overlay.html` with `preview=1` and creates random fake messages from Twitch, YouTube, and Kick. Live mode loads the same overlay URL without `preview=1`, connects to Streamer.bot, and displays real messages.

The preview user/message arrays are stored in `overlay/overlay.js` as:

- `PREVIEW_USERS`
- `PREVIEW_MESSAGES`

These are intentionally separated from the renderer logic so preset sample users can be added later.

## v0.1.11 changes

- Removed the GitHub Pages-ready tag from the title area.
- Removed the preview-window helper sentence under the Preview Window title.
- Collapsed all control deck sections by default.
- Reworked the Platforms section into three rows with platform icon, platform name, and toggle switch.
- Reworked Moderation & Filtering toggles into a single-column layout to avoid cramped wrapping.
- Removed the colored glow from announcement highlights while keeping the colored announcement bubble/card treatment.

## Recommended workflow for future edits

For broad changes, update the zip package.

For small adjustments after the system is working, edit individual files:

- Dashboard structure, styling, settings, preview, and URL generation: `index.html`
- OBS overlay structure: `overlay/overlay.html`
- OBS overlay styling: `overlay/overlay.css`
- OBS rendering, WebSocket handling, message parsing, emotes, and GIF handling: `overlay/overlay.js`
- Setup instructions: `README.md`

## Known limitations in v0.1.11

- Profile images depend on whether Streamer.bot includes an image URL in the event payload.
- YouTube and Kick payload structures may vary by Streamer.bot version, so the normalizer uses multiple fallback fields.
- Twitch native emotes require Streamer.bot to provide emote index/image data.
- Channel BTTV and 7TV emotes require Twitch user IDs, not usernames.
- GIF detection currently targets direct `.gif` URLs only.

## v0.1.11 structure note

The dashboard CSS and JavaScript are embedded directly in `index.html`.

The OBS overlay remains separated into:

```text
overlay/overlay.html
overlay/overlay.css
overlay/overlay.js
```

Live GitHub Pages files required for this version:

```text
index.html
overlay/
  overlay.html
  overlay.css
  overlay.js
```

`README.md` is documentation only and is not required for the live overlay to run.
