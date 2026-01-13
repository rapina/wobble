# Wobble 애니메이션 시스템 정리

현재 구현된 코드를 분석하여 연상되는 애니메이션 패턴들을 정리합니다.

## 1. 캐릭터 기본 애니메이션 (Wobble.ts)

### 바디 애니메이션
| 속성 | 설명 | 사용처 |
|------|------|--------|
| `wobblePhase` | 몸체의 젤리같은 출렁임 | 모든 shape에 적용 |
| `scaleX/scaleY` | 찌그러짐/늘어남 (squash & stretch) | 호흡, 충격, 점프 |
| `opacity` | 페이드 인/아웃 | 등장, 퇴장, 피격 |

### 표정 시스템 (WobbleExpression)
```
happy     → 기본 행복한 표정 (웃는 입, 반짝이는 눈)
neutral   → 무표정 (일자 입)
surprised → 놀람 (큰 동그란 눈, O자 입)
worried   → 걱정 (찌푸린 눈썹, 구부러진 입)
effort    → 힘주는 중 (찡그린 눈, 작은 입)
struggle  → 고통 (X자 눈, 물결 입)
dizzy     → 어지러움 (소용돌이 눈)
hot       → 뜨거움 (반쯤 감은 눈, 벌린 입)
charge    → 차징 중 (찡그린 눈)
excited   → 흥분 (반짝이는 눈, 큰 웃음)
sleepy    → 졸림 (반달 눈, 일자 입)
angry     → 화남 (금색 눈, 찌푸린 눈썹)
none      → 얼굴 없음
```

### 보조 효과
| 효과 | 속성 | 용도 |
|------|------|------|
| **그림자** | `showShadow`, `shadowOffsetY` | 공중에 떠있는 느낌 |
| **다리** | `showLegs`, `legPhase` | 걷기/달리기 |
| **스피드라인** | `showSpeedLines`, `speedDirection` | 빠른 이동 |
| **땀방울** | `showSweat` | 긴장/노력 |
| **글로우** | `glowColor`, `glowIntensity` | 파워업/차징 |
| **시선** | `lookDirection` | 특정 방향 응시 |

---

## 2. UI 애니메이션 (SandboxScreen.tsx)

### 오프닝 시퀀스
```
1. 배경 Balatro 셰이더 (무한 루프)
2. 떠다니는 수식 심볼들 (float-0, float-1, float-2)
3. 워블 캐릭터 등장 (scale 0→1, spring effect)
4. 텍스트 순차 등장 (translate-y 애니메이션, 400ms 간격)
5. "Tap to Start" 바운스 (bounce-arrow)
```

### CSS 키프레임
```css
wobble-float    → 상하 8px 부유 (2s)
bounce-arrow    → 화살표 바운스 + 투명도 변화 (1s)
float-0/1/2     → 수식 심볼 부유 + 회전 (3-4s)
```

### 전환 애니메이션
- `fade-in`, `zoom-in-95` (팝업 등장)
- `slide-in-from-top` (드롭다운 메뉴)
- `active:scale-95` (버튼 눌림)

---

## 3. 연상되는 추가 애니메이션 아이디어

### 캐릭터 상태 전이
```
idle        → wobblePhase 천천히 증가, 가벼운 호흡
walking     → showLegs + legPhase 증가 + 좌우 흔들림
running     → 빠른 legPhase + showSpeedLines
jumping     → scaleY 압축→신장, shadowOffsetY 증가
landing     → scaleX 확장 + scaleY 압축 (squash)
charging    → glowIntensity 증가, expression: 'charge'
hit         → 빨간 flash + expression: 'struggle' + 흔들림
death       → 회전하며 축소 + opacity 감소
victory     → expression: 'excited' + 점프 반복
```

### Shape별 특수 애니메이션
```
circle (Wobi)     → 통통 튀는 바운스
square (Boxy)     → 무겁게 쿵쿵
triangle (Spike)  → 날카로운 회전/찌르기
star (Twinkle)    → 반짝임 + 회전
diamond (Gem)     → 광택 하이라이트 이동
pentagon (Penta)  → 견고한 진동
shadow (Shadow)   → 뾰족한 털 흔들림 + 눈 깜빡임
```

### 상호작용 애니메이션
```
collision       → 두 캐릭터 모두 squash + 튕겨나감
merge           → 하나로 합쳐지며 커짐
split           → 작은 캐릭터들로 분리
attract         → 서로를 향해 늘어남
repel           → 서로 반대로 밀려남
orbit           → 중심 주변 회전
```

### UI 피드백 애니메이션
```
card_select     → 카드 확대 + 글로우
card_hover      → 살짝 들어올림 (translateY)
value_change    → 숫자 펄스 효과
new_unlock      → 황금빛 파티클 + 캐릭터 등장
achievement     → 화면 전체 플래시 + 배너 슬라이드
```

---

## 4. 현재 Survivor 게임에서 활용 가능한 패턴

기존 코드 기반으로 게임에 적용할 수 있는 애니메이션:

| 게임 이벤트 | Wobble 속성 조합 |
|------------|------------------|
| 적 스폰 | opacity 0→1 + scale 0→1 |
| 플레이어 이동 | showLegs + speedLines (빠를 때) |
| 피격 | expression: 'struggle' + 빨간 tint + shake |
| 경험치 획득 | glowIntensity 펄스 |
| 레벨업 | expression: 'excited' + 큰 글로우 + 파티클 |
| 스킬 시전 | expression: 'charge' → 'effort' |
| 사망 | expression: 'dizzy' + 회전 + 축소 + fade |
| 보스 등장 | 화면 흔들림 + 큰 shadow 캐릭터 |

---

## 5. 디자인 일관성 가이드

**LocoRoco 스타일 원칙:**
- 부드럽고 탄력있는 움직임 (bezier curve 활용)
- 과장된 squash & stretch
- 단순하지만 표현력 있는 얼굴
- 밝고 채도 높은 색상
- 검정 아웃라인 (LOCOROCO_OUTLINE: 0x2c2c2c)

**Balatro 스타일 원칙:**
- 레트로 픽셀/CRT 느낌의 배경
- 카드 기반 UI 컴포넌트
- 황금/빨강/파랑 컬러 팔레트
- 두꺼운 검정 테두리 + box-shadow
- 스프링/바운스 인터랙션
