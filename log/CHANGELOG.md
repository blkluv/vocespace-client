# CHANGELOG

## v0.1.3

- date: 2025-04-01
- branch: dev_0.1.3

### Features

- Settings
  - [x] General
    - [x] Username
    - [x] language
    - [ ] User status
  - [x] Audio
    - [x] Volume
    - [x] Selection
  - [x] Video
    - [x] Blur
    - [x] Selection
    - [x] Screen Blur
  - [ ] Virtual
    - [ ] Models
    - [ ] Backgrounds
    - [ ] Active or not
    - [ ] Detect check
  - [x] About Us
- language change
- tab for different way to room
- [ ] enter room by using link


格式为: ^(https?:\/\/)?(vocespace.com|space.voce.chat)\/rooms\/([a-zA-Z0-9]+)$
router.push(`/rooms/${roomUrl}`);
## v0.1.2

- date: 2025-03-28
- branch: dev_0.1.2

### Features

- PreJoin add video blur
- PreJoin add video blur test
- PreJoin username ulid if not write
- PreJoin Reset settings
- Auto Username
- Enter into target room

## v0.1.1

- date: 2025-03-26
- branch: dev_0.1.1

### Features

- PreJoin add volume adjust
- PreJoin add volume test

### Fixes

### UI / Components

#### `app/page.tsx`

- remove custom tab

#### `app/pages/pre_join/demo.tsx`

- `input` -> `ant::Input`

## v0.1.0

- date: 2025-03-26
- branch: main

### Features

- Basic prejoin before join the room
- Room
  - Mircophone
  - Camera
  - Screen Share
  - Leave
  - Different chat Layouts
- Permission
  - Request
  - Description and guide
- AI
  - Noice cancellation
- i18n
  - Chinese
  - English
- e2ee

### Fixes