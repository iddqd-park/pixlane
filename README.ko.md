# PixLane

[Read in English](./README.md)

**PixLane**은 스크린샷을 예쁘게 꾸미거나 민감한 정보를 가릴 수 있는 보완적인 이미지 편집 도구입니다. HTML5 Canvas를 활용하여 브라우저 내에서 100% 동작하며, 서버로 이미지를 전송하지 않아 데이터 유출 걱정 없이 안전하게 사용할 수 있습니다.

# Our Philosophy
IDDQD Internet은 별도의 DB나 회원가입 없이, 순수 HTML/JS만으로 브라우저에서 즉시 실행되는 도구를 개발합니다. AI 기능을 제공할 때도 데이터 상태를 유지하지 않으며(stateless), 어떠한 기록도 남기지 않는 원칙을 고수합니다.

### [PixLane 브라우저에서 바로 실행하기](https://app.iddqd.kr/pixlane)

![PixLane 스플래시](./splash.png)

## Features
- **100% 클라이언트 사이드 처리**: 모든 작업이 브라우저 내부에서 이루어지며, 서버로 이미지가 전송되지 않습니다.
- **스크린샷 꾸미기**: 이미지 모서리 둥글게(Radius), 그림자(Drop Shadow), 여백(Padding) 및 배경(Background) 효과를 쉽게 적용할 수 있습니다.
- **민감 정보 가리기(Redaction)**: 이미지의 특정 부위를 드래그하여 손쉽게 블러(Blur) 처리할 수 있습니다.
- **설치 및 로그인 불필요**: 웹 브라우저만 있으면 언제 어디서든 즉시 사용 가능합니다.

## Usage
1. **이미지 업로드**: 이미지를 드래그 앤 드롭하거나 클릭하여 선택합니다.
2. **편집**:
    - **Radius**: 모서리 둥글기 및 그림자 효과를 조절합니다.
    - **Padding**: 이미지 주변의 여백을 상하좌우 자유롭게 설정합니다.
    - **Background**: 여백 공간에 채울 배경색이나 그라데이션을 선택합니다.
    - **Blur**: 가리고 싶은 부분을 드래그하여 블러 처리합니다.
3. **저장**: PNG 또는 JPEG 포맷으로 결과물을 다운로드합니다.

## Tech Stack
- **Core**: HTML5, Vanilla JavaScript, jQuery
- **Rendering**: HTML5 Canvas API
- **Styling**: Bootstrap 5, CSS3

# Contact & Author
박실장
- IDDQD 인터넷 e-솔루션 및 e-게임 사업부 개발실장
- 기습코딩꾼 & 최상무의 모사꾼
- 홈페이지: https://iddqd.kr/
- 깃허브: https://github.com/iddqd-park
