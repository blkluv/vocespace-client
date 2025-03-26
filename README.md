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

- [ ] Prejoin before join the room
  - [x] Basic
  - [ ] More settings
- [ ] Room for chat
  - [x] Mircophone
  - [x] Camera
  - [x] Screen Share
  - [ ] Settings
  - [x] Leave
  - [x] Different chat Layouts
  - [ ] Wave｜Remind others
- [x] Permission 
  - [x] Request
  - [x] Description and guide
- [ ] Participant
  - [ ] Status
  - [ ] Settings
- [ ] AI
  - [x] Noice cancellation
  - [ ] Virtual role
- [x] i18n
  - [x] Chinese
  - [x] English
- [x] e2ee
### CHANGELOG

See [CHANGELOG](./log/CHANGELOG.md)