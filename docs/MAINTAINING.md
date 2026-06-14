# Maintaining Zhijuan Prompt Card

## Triage Cadence

- 每周看 issue
- 标记 bug / feature / model compatibility / docs / privacy / good first issue
- 无复现信息的 issue 先要求补充，长期无回应再关闭

## Contribution Policy

- 优先小 PR
- 架构变化先讨论
- 拒绝隐藏网络请求
- 拒绝硬编码私有 endpoint
- 拒绝开源核心内置付费锁

## Privacy Policy

- local-first 是默认
- BYOK 是默认
- optional cloud 必须保持 optional
- 新网络请求必须写入 README / SECURITY / PR 说明

## Release Policy

- semantic versioning
- patch: bug fix
- minor: feature
- major: breaking change
- release notes 必须写 privacy/network changes

## Roadmap Policy

- open-source core remains usable without official cloud
- hosted cloud recognition can be separate optional product later
- web/mac/team products must not degrade the open-source extension

## Suggested GitHub Topics

- chrome-extension
- browser-extension
- image-to-prompt
- prompt-engineering
- ai-art
- midjourney
- gemini
- chatgpt
- local-first
- byok
- typescript
- vite
- react
