# ProductLoom

[English](README.md) | 한국어

ProductLoom은 기획 의도와 근거 자료, 제품 계약, 디자인 결정, 구현 인수인계를 하나의
버전 관리 워크스페이스로 연결합니다.

다음 구성요소를 함께 제공합니다.

- 일관된 워크스페이스 생성과 검증을 위한 외부 의존성 없는 CLI
- 제품 작업 단계를 안내하는 7개의 Codex 스킬
- 언어, 제품 영역, 경로, 문서 ID, 상태, 완료 정책을 조정할 수 있는 설정
- 기존 PLW 저장소를 변경하지 않고 도입할 수 있는 호환 프로필

CLI는 로컬 파일만 읽고 씁니다. 외부 문서, 디자인, 저장소, 알림 도구는 사용자가
워크플로 스킬을 통해 명시적으로 활성화한 경우에만 사용합니다.

## 준비 사항

- Node.js 20 이상
- Git
- GitHub CLI는 선택 사항이며 저장소 작업 시 사용을 권장
- Codex 플러그인 스킬을 사용할 때만 Codex 필요

설치 후 현재 환경을 확인할 수 있습니다.

```bash
productloom doctor
```

## 5분 만에 시작하기

GitHub 저장소에서 CLI를 전역 설치합니다.

```bash
npm install --global github:hawoond/productloom
productloom --version
```

ProductLoom을 적용할 애플리케이션 저장소에서 초기화합니다.

```bash
cd your-repository

productloom init \
  --name "Storefront" \
  --namespace storefront \
  --locales ko,en \
  --products app,admin
```

최초 요구사항을 기록하고 화면 단위 문서 묶음을 생성합니다.

```bash
productloom new brief \
  --title "홈 화면 목표" \
  --slug home-goals \
  --locale ko \
  --product app \
  --screen home

productloom new screen \
  --locale ko \
  --product app \
  --screen home \
  --title "홈"

productloom validate --mode strict
productloom status
```

`productloom init`은 `.productloom/workspace.json`과 설정된 문서 디렉터리를 생성합니다.
`productloom new screen`을 실행하면 다음 문서가 함께 만들어집니다.

```text
product/ko/
├── raw/
│   ├── briefs/
│   ├── feedback/
│   ├── meetings/
│   └── references/
├── spec/app/home/
│   ├── spec.md
│   └── flow.md
└── design/app/home/
    ├── plan.md
    ├── components.md
    └── tokens.md
```

이미 존재하는 파일은 `--force`를 지정하지 않는 한 덮어쓰지 않습니다. `init`, `new`,
`validate`, `audit`, `status`, `doctor`, `migrate` 명령은 애플리케이션 소스 코드를
변경하지 않습니다.

## Codex 플러그인 설치

CLI는 단독으로 사용할 수 있습니다. 원본 자료 정리, 제품 계약 작성, 디자인 준비,
검증, 구현 인수인계를 단계별로 안내받고 싶다면 플러그인도 설치합니다.

```bash
codex plugin marketplace add hawoond/productloom --ref main
codex plugin add productloom@productloom
codex plugin list
```

다음과 같이 시작할 수 있습니다.

```text
$productloom-orchestrate 이 저장소에 ProductLoom을 설정해줘.
$productloom-ingest 이 회의록을 추적 가능한 제품 브리프로 정리해줘.
$productloom-spec checkout 화면의 계약과 플로우를 작성해줘.
$productloom-validate checkout 화면의 구현 준비 상태를 확인해줘.
```

스킬은 CLI 검증을 대체하지 않습니다. 워크스페이스 구조와 다음 단계 진행 여부는
CLI의 결정적 검증 결과를 기준으로 판단합니다.

## 권장 작업 흐름

```text
원본 자료
  → 브리프·회의록·참고자료·피드백
  → 제품 계약(spec)과 흐름(flow)
  → 디자인 계획·컴포넌트·토큰
  → 구현 준비 검증
  → 구현
```

### 1. 원본 자료 기록

아직 구현 계약으로 확정되지 않은 요구사항과 근거는 raw 문서로 기록합니다.

```bash
productloom new brief \
  --title "결제 목표" \
  --slug checkout-objective \
  --locale ko \
  --product app \
  --screen checkout \
  --owners product,engineering

productloom new meeting \
  --title "결제 검토 회의" \
  --slug checkout-review \
  --locale ko \
  --product app \
  --screen checkout

productloom new reference \
  --title "결제 API 참고자료" \
  --slug payment-api \
  --locale ko \
  --product app \
  --screen checkout

productloom new feedback \
  --title "모바일 결제 피드백" \
  --slug mobile-checkout \
  --locale ko \
  --product app \
  --screen checkout
```

회의록 파일명에는 현재 날짜가 포함됩니다. 나머지 raw 문서는 지정한 slug를 파일명으로
사용합니다. `--locale`, `--product`, `--screen`을 생략하면 설정의 첫 번째 언어와 제품,
그리고 `general` 화면을 사용합니다.

### 2. 화면 계약 묶음 생성

```bash
productloom new screen \
  --locale ko \
  --product app \
  --screen checkout \
  --title "결제" \
  --owners product,design,engineering
```

한 번의 명령으로 다음 5개 문서를 만듭니다.

| 문서 | 역할 |
|---|---|
| `spec.md` | 관찰 가능한 동작, 권한, 데이터, 오류, 호환성 계약 |
| `flow.md` | 사용자·시스템 상태 전이, 분기, 재시도, 실패 흐름 |
| `plan.md` | 반응형 상태, 상호작용, 접근성, 디자인 결정 |
| `components.md` | 재사용 UI 구성요소와 상태 매핑 |
| `tokens.md` | 의미 기반 디자인 토큰 매핑 |

각 문서는 안정적인 문서 ID와 `source_refs`로 연결됩니다.

### 3. 계약과 디자인 구체화

- 확인되지 않은 요구사항은 단정하지 않고 raw 근거를 연결합니다.
- 백엔드·프런트엔드에서 관찰 가능한 동작은 `spec.md`에 기록합니다.
- 정상 경로뿐 아니라 빈 상태, 오류, 재시도, 권한 거부 흐름을 `flow.md`에 포함합니다.
- 제품 동작을 바꾸는 디자인 판단은 임의로 확정하지 않고 계약에 다시 반영합니다.
- 구현에 필요한 화면 상태와 접근성 조건은 `plan.md`에 명시합니다.
- 기존 디자인 시스템의 구성요소와 토큰을 우선 매핑합니다.

문서의 `status`와 검증 결과는 서로 다릅니다. 상태는 합의 여부를 나타내고, 검증은
문서 구조와 참조가 다음 단계에 충분한지 확인합니다.

### 4. 단계 전환 전 검증

일반적인 신규 워크스페이스 검증:

```bash
productloom validate --mode strict
```

경고도 실패로 처리:

```bash
productloom validate --mode strict --fail-on-warn
```

구현 인수인계 준비 상태 확인:

```bash
productloom validate \
  --mode strict \
  --gate implementation-readiness \
  --fail-on-warn
```

CI나 다른 도구에서 사용할 JSON 출력:

```bash
productloom validate --mode strict --format json
```

### 5. 워크스페이스 상태 점검

```bash
productloom status
productloom status --format json
productloom audit
productloom doctor
```

- `status`: 제품, 문서 계층, 상태별 문서 현황과 검증 상태를 요약합니다.
- `audit`: strict 기준으로 구조와 참조를 다시 점검합니다.
- `doctor`: Node.js, Git, 선택 사항인 GitHub CLI, 워크스페이스 설정을 확인합니다.

## 명령어 전체 안내

| 명령 | 파일 변경 | 용도 |
|---|---:|---|
| `productloom init [path]` | 예 | 설정과 기본 디렉터리 생성 |
| `productloom new screen` | 예 | spec·flow·디자인 문서 묶음 생성 |
| `productloom new brief` | 예 | 제품 목표와 요구사항 기록 |
| `productloom new meeting` | 예 | 날짜가 포함된 회의 근거 기록 |
| `productloom new reference` | 예 | 참고 자료 등록 |
| `productloom new feedback` | 예 | 사용자·지원·검토 피드백 기록 |
| `productloom validate [path]` | 아니요 | 설정, 문서, 쌍, 참조 검증 |
| `productloom audit [path]` | 아니요 | strict 기준 전체 점검 |
| `productloom status [path]` | 아니요 | 문서 범위와 검증 상태 요약 |
| `productloom doctor [path]` | 아니요 | 실행 환경과 설정 확인 |
| `productloom migrate [path] --from plw` | `--apply`일 때만 | PLW 호환 설정 미리보기 또는 생성 |

공통 옵션:

| 옵션 | 의미 |
|---|---|
| `--root <path>` | 워크스페이스 루트를 직접 지정 |
| `--locale <name>` | 새 문서에 사용할 언어 |
| `--product <name>` | 새 문서에 사용할 제품 영역 |
| `--screen <name>` | 화면 또는 기능 식별자 |
| `--title <text>` | 사람이 읽는 문서 제목 |
| `--slug <name>` | raw 문서 파일명 |
| `--owners <a,b>` | 쉼표로 구분한 담당자 또는 팀 |
| `--status <name>` | 새 문서의 최초 상태 |
| `--force` | 기존 생성 파일 또는 설정을 의도적으로 교체 |
| `--format text\|json` | 사람용 또는 도구용 출력 선택 |
| `--fail-on-warn` | 경고가 있으면 실패 코드 반환 |

초기화 전용 옵션:

```bash
productloom init [path] \
  --profile default \
  --name "제품 이름" \
  --namespace product-name \
  --locales ko,en \
  --products app,admin
```

- `--name`: 화면에 표시할 워크스페이스 이름
- `--namespace`: 문서 ID 앞부분에 사용할 안정적인 식별자
- `--locales`: 쉼표로 구분한 언어 목록
- `--products`: 쉼표로 구분한 제품 영역 목록
- `--profile`: 신규 저장소는 `default`, PLW 구조를 직접 만들 때는 `plw-compat`

간단한 내장 도움말은 `productloom help`로 확인합니다.

## 검증 방식

검증 모드:

- `strict`: 설정 스키마, 문서 ID와 frontmatter, spec-flow 쌍, 디자인 문서, 참조 경로,
  상태, 버전, 구현 준비 조건을 검사합니다.
- `compat`: 기존 PLW 문서 구조의 차이를 가능한 범위에서 비차단 경고로 유지하면서
  문제를 보고합니다.

검증 결과:

- `PASS`: 진행을 막는 진단이 없습니다.
- `WARN`: 검토하거나 명시적으로 수용해야 할 비차단 위험이 있습니다.
- `FAIL`: 필수 구조 또는 추적성이 누락되었습니다.

종료 코드:

- `0`: 차단 오류가 없습니다. `--fail-on-warn`이 없으면 경고는 허용됩니다.
- `1`: 검증 또는 필수 doctor 항목이 실패했습니다.
- `2`: 명령이나 설정을 처리할 수 없습니다.

## 기존 PLW 저장소에 적용

PLW는 ProductLoom Workspace의 축약어입니다. 호환 프로필은 조직에 종속된 명칭 없이
기존 `KR/raw`, `KR/spec`, `KR/design` 구조를 그대로 유지합니다.

마이그레이션은 기본적으로 미리보기만 수행합니다. `--apply`를 지정해야 호환 설정을
생성하며, 기존 문서를 이동하거나 이름을 바꾸지 않습니다.

```bash
cd your-plw-repository

# 변경 없이 생성 예정 설정 확인
productloom migrate --from plw

# .productloom/workspace.json만 생성
productloom migrate --from plw --apply

# 기존 구조에 맞춘 검증
productloom validate --mode compat
```

권장 도입 순서:

1. `compat`를 최초 차단 검증으로 사용합니다.
2. `strict`는 보고 전용으로 실행하여 기존 경고 기준선을 확인합니다.
3. 기존 문서 차이를 수정하거나 허용 근거를 남깁니다.
4. 정리가 끝나면 strict 검증을 차단 단계로 전환합니다.

## 워크스페이스 설정

ProductLoom은 현재 디렉터리부터 상위 디렉터리로 이동하며
`.productloom/workspace.json`을 찾습니다.

설정에서 다음 항목을 관리합니다.

- 워크스페이스 이름과 문서 namespace
- 언어와 제품 영역
- raw, spec, design 문서 경로
- 문서 ID 패턴과 언어 frontmatter 필드
- 기본 상태와 허용 상태
- 필수 디자인 문서
- 선택적인 원본 자료 레지스트리
- 기준 브랜치와 PR·CI·병합 완료 정책

전체 설정 형식은 [Workspace reference](docs/workspace-reference.md), 확장 경계는
[Architecture](docs/architecture.md)를 참고합니다.

## CI 적용 예시

신규 strict 워크스페이스:

```yaml
- name: Validate ProductLoom
  run: productloom validate --mode strict --gate implementation-readiness --fail-on-warn
```

PLW 도입 초기:

```yaml
- name: Validate ProductLoom compatibility
  run: productloom validate --mode compat

- name: Report strict ProductLoom findings
  continue-on-error: true
  run: productloom validate --mode strict --format json
```

이 저장소의 전체 예시는 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)에 있습니다.

## 자주 발생하는 문제

### 워크스페이스 설정을 찾지 못하는 경우

초기화한 저장소 안에서 실행하거나 `--root`를 지정합니다.

```bash
productloom doctor --root /path/to/repository
```

### 생성하려는 파일이 이미 있는 경우

ProductLoom은 기존 내용을 보호합니다. 파일을 먼저 검토한 뒤 교체가 의도된 경우에만
`--force`를 사용합니다.

### 경고가 있는데 검증 명령이 성공하는 경우

경고는 기본적으로 비차단입니다. 로컬 또는 CI에서 경고도 차단하려면
`--fail-on-warn`을 추가합니다.

### 참조 대상이 없다는 오류가 발생하는 경우

`source_refs` 값은 워크스페이스 기준 상대 경로입니다. 경로를 수정하거나 참조 문서를
복구한 후 strict 검증을 다시 실행합니다.

### PLW strict 검증에서 기존 경고가 많이 나오는 경우

처음부터 기존 문서를 대량 수정하지 않습니다. `compat`를 차단 기준으로 유지하고
strict JSON 결과를 저장하여 경고 유형별로 점진적으로 정리합니다.

## 개인정보와 외부 연동

CLI에는 사용량 전송 기능이 없으며 네트워크 요청을 수행하지 않습니다. 인증 정보,
접근 토큰, 개인 연락처, 비공개 커넥터 설정은 ProductLoom 문서나 워크스페이스 설정에
저장하지 않습니다.

## 개발과 검증

```bash
git clone https://github.com/hawoond/productloom.git
cd productloom
npm test
npm run check
```

이 프로젝트는 [MIT License](LICENSE)로 배포됩니다.
