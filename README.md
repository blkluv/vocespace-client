<a href="https://space.voce.chat/rooms/bby6-x55t">
  <img src="./.github/assets/vocespace.svg" alt="VoceSpace logo" width="240" height="120">
</a>

# VoceSpace

## Demo

Give it a try at [vocespace demo](https://space.voce.chat/rooms/bby6-x55t)

## Dev Setup

Steps to get a local dev setup up and running:

1. Run `pnpm install` to install all dependencies.
2. Copy `.env.example` in the project root and rename it to `.env.local`.
3. Update the missing environment variables in the newly created `.env.local` file.
4. Run `pnpm dev` to start the development server and visit [http://localhost:3000](http://localhost:3000) to see the result.
5. Start development 🎉

## Features

The follings are basic features, if you want more details, see [FEATURE](./log/FEATURE.md)

### Prejoin before join the room

- Basic
  - [x] Mircophone
  - [x] Camera
  - [x] Preview for Video
  - [x] Username
  - [x] Join room
- More settings
  - [x] Volume adjust
  - [x] Volume test
  - [x] Microphone device selection
  - [x] Video blur adjust
  - [x] Video blur test
  - [x] Camera device selection
  - [x] Reset Settings
  - [x] Auto Username
  - [x] Username ulid if not write

### Room for chat

- Basic
  - [x] Mircophone
  - [x] Camera
  - [x] Screen Share
  - [x] Leave
  - [x] Different chat Layouts
  - [x] Settings
    - [x] General
      - [x] Username
      - [x] Language
      - [x] User status
    - [x] Audio
      - [x] Volume
      - [x] Selection
    - [x] Video
      - [x] Blur
      - [x] Selection
      - [x] Screen Blur
    - [x] Virtual
      - [x] Models
      - [x] Backgrounds
      - [x] Active or not
      - [x] Detect check
      - [x] Compare
    - [x] About Us

### Ws

- [x] Others cursors focus
- [x] Wave｜Remind others

### Permission

- [x] Request
- [x] Description and guide

### AI

- [x] Noice cancellation
- [x] Virtual role

### i18n

- [x] Chinese
- [x] English

### e2ee

- [x] enabled

### CHANGELOG

See [CHANGELOG](./log/CHANGELOG.md)