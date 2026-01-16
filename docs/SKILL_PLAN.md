# Physics Formula → Survivor Skill 매핑 계획

## 개요

51개 물리 공식을 써바이벌 게임 스킬로 매핑하는 계획입니다.
각 스킬은 해당 물리 개념을 게임플레이로 표현합니다.

---

## 현재 구현된 스킬 (16개)

| # | Formula ID | Skill ID | 한글명 | 효과 |
|---|------------|----------|--------|------|
| 1 | elastic-collision | elastic-bounce | 탄성 충돌 | 튕기는 투사체 |
| 2 | momentum | momentum-pierce | 운동량 관통 | 관통 투사체 |
| 3 | ideal-gas | pressure-wave | 압력파 | 폭발 범위 공격 |
| 4 | photoelectric | frequency-burst | 진동수 증폭 | 발사 속도 증가 |
| 5 | newton-second | fma-impact | F=ma 충격 | 데미지/넉백 증가 |
| 6 | gravity | gravity-pull | 중력 유도 | 유도 투사체 |
| 7 | snell | refraction-spread | 굴절 확산 | 다방향 발사 |
| 8 | centripetal | centripetal-pulse | 원심력 펄스 | 주기적 충격파 |
| 9 | hooke | elastic-return | 탄성 회귀 | 돌아오는 투사체 |
| 10 | lorentz | magnetic-shield | 자기장 방어 | 적 경로 굴절 |
| 11 | coulomb | static-repulsion | 정전기 반발 | 적 밀어내기 |
| 12 | buoyancy | buoyant-bomb | 부력 폭탄 | 떠올랐다 낙하 폭발 |
| 13 | tunneling | quantum-tunnel | 양자 터널링 | 확률적 관통+보너스 |
| 14 | pendulum | pendulum-rhythm | 진자 리듬 | 주기적 데미지 증폭 |
| 15 | torque | torque-slash | 토크 회전참 | 회전 근접 공격 |
| 16 | time-dilation | time-warp | 시간 왜곡 | 적 감속 |

---

## 새로 추가할 스킬 (35개)

### 역학 (Mechanics) - 3개

| Formula ID | Skill ID | 한글명 | 설명 | 효과 |
|------------|----------|--------|------|------|
| kinetic-energy | kinetic-charge | 운동 에너지 충전 | 이동하면 에너지가 쌓여 다음 공격이 강해짐 | `chargePerDistance`, `maxCharge`, `damagePerCharge` |
| pressure | pressure-point | 압력점 공격 | 작은 면적에 집중된 힘 = 높은 관통력 | `areaReduction`, `penetrationBonus` |
| inverse-square | inverse-blast | 역제곱 폭발 | 거리에 따라 데미지 급감하는 강력한 근접 폭발 | `baseRadius`, `peakDamage`, `falloffRate` |

### 중력 & 진동 (Gravity & Oscillation) - 4개

| Formula ID | Skill ID | 한글명 | 설명 | 효과 |
|------------|----------|--------|------|------|
| free-fall | free-fall-strike | 자유 낙하 타격 | 위에서 떨어지는 투사체, 높이에 비례한 데미지 | `fallHeight`, `impactRadius`, `gravityMultiplier` |
| projectile | arc-shot | 포물선 사격 | 포물선 궤적으로 장애물 넘어 공격 | `launchAngle`, `range`, `splashRadius` |
| escape-velocity | escape-burst | 탈출 속도 폭발 | 충분한 속도면 중력장 탈출하며 폭발 | `velocityThreshold`, `escapeBonus`, `burstRadius` |
| kepler-third | orbital-strike | 궤도 폭격 | 플레이어 주변을 도는 위성 공격체 | `orbitCount`, `orbitRadius`, `orbitDamage` |

### 파동 & 광학 (Wave & Optics) - 4개

| Formula ID | Skill ID | 한글명 | 설명 | 효과 |
|------------|----------|--------|------|------|
| wave | wave-pulse | 파동 펄스 | 파동처럼 퍼지는 데미지 (사인파 형태) | `wavelength`, `amplitude`, `waveSpeed` |
| reflection | mirror-shot | 반사 사격 | 벽/장애물에 완벽 반사, 입사각=반사각 | `reflectCount`, `reflectDamageBonus` |
| lens | focus-beam | 초점 광선 | 특정 거리에서 수렴하여 최대 데미지 | `focalLength`, `focusDamageMultiplier`, `beamWidth` |
| standing-wave | resonance-zone | 공명 지대 | 정상파처럼 특정 위치에 데미지 노드 생성 | `nodeCount`, `nodeRadius`, `nodeDamage` |

### 열역학 (Thermodynamics) - 6개

| Formula ID | Skill ID | 한글명 | 설명 | 효과 |
|------------|----------|--------|------|------|
| heat | heat-transfer | 열 전달 | 적을 때릴수록 열이 축적, 연소 데미지 | `heatPerHit`, `maxHeat`, `burnDamage` |
| first-law | energy-convert | 에너지 변환 | 받은 데미지 일부를 공격력으로 변환 | `conversionRate`, `maxStored`, `releaseMultiplier` |
| entropy | chaos-field | 혼돈장 | 무질서도 증가 = 적 이동 경로 불규칙화 | `fieldRadius`, `chaosStrength`, `durationBonus` |
| thermal-conduction | heat-chain | 열 전도 체인 | 데미지가 인접한 적에게 전도됨 | `conductRange`, `conductRatio`, `maxChain` |
| stefan-boltzmann | radiant-aura | 복사 오라 | 온도에 비례한 T⁴ 지속 데미지 오라 | `auraRadius`, `baseTemp`, `radiationDamage` |
| wien | peak-wavelength | 피크 파장 | 특정 온도에서 최대 효율 공격 (쿨/핫 존) | `optimalRange`, `peakBonus`, `falloffRate` |

### 전기 (Electricity) - 3개

| Formula ID | Skill ID | 한글명 | 설명 | 효과 |
|------------|----------|--------|------|------|
| ohm | resistance-drain | 저항 흡수 | 적의 저항(방어력)을 낮춤 | `resistanceReduction`, `duration`, `stackable` |
| electric-power | power-surge | 전력 서지 | V×I = P, 전압과 전류 조합으로 순간 폭딜 | `voltage`, `current`, `surgeDamage` |
| capacitor | charge-release | 충전 방출 | 에너지 축적 후 한번에 방출 | `maxCharge`, `chargeRate`, `dischargeDamage` |

### 현대 물리 (Modern Physics) - 3개

| Formula ID | Skill ID | 한글명 | 설명 | 효과 |
|------------|----------|--------|------|------|
| debroglie | matter-wave | 물질파 | 투사체가 파동처럼 여러 경로로 간섭 | `waveSpread`, `interferenceBonus`, `pathCount` |
| uncertainty | uncertainty-strike | 불확정성 타격 | 위치 불확실 = 회피 불가, 운동량 불확실 = 데미지 변동 | `positionSpread`, `momentumVariance` |
| bohr | quantum-leap | 양자 도약 | 특정 에너지 준위에서만 공격 (불연속 데미지) | `energyLevels[]`, `transitionBonus` |

### 양자역학 (Quantum) - 1개

| Formula ID | Skill ID | 한글명 | 설명 | 효과 |
|------------|----------|--------|------|------|
| infinite-well | bound-state | 속박 상태 | 특정 영역 내 갇힌 적에게 증폭 데미지 | `wellWidth`, `boundBonus`, `escapePenalty` |

### 화학 (Chemistry) - 3개

| Formula ID | Skill ID | 한글명 | 설명 | 효과 |
|------------|----------|--------|------|------|
| ph | acid-base | 산-염기 | pH에 따른 부식/회복 효과 | `acidDamage`, `baseHeal`, `neutralBonus` |
| dilution | concentration | 농도 집중 | 공격을 모을수록 농도 상승, 데미지 증가 | `concentrationRate`, `maxConcentration`, `dilutionDecay` |
| reaction-rate | catalyst | 촉매 효과 | 특정 조건에서 반응 속도(공격 속도) 급증 | `activationCondition`, `rateMultiplier`, `duration` |

### 추가 물리 (Additional Physics) - 8개

| Formula ID | Skill ID | 한글명 | 설명 | 효과 |
|------------|----------|--------|------|------|
| radioactive-decay | decay-chain | 붕괴 연쇄 | 적 처치 시 확률적으로 연쇄 붕괴 폭발 | `decayChance`, `halfLife`, `chainRadius` |
| angular-momentum | spin-conserve | 각운동량 보존 | 회전 공격 시 속도 유지, 점점 강해짐 | `spinSpeed`, `momentumRetention`, `spinDamageBonus` |
| bernoulli | flow-stream | 유체 흐름 | 빠른 흐름 = 낮은 압력, 적을 끌어당김 | `flowSpeed`, `suctionForce`, `streamWidth` |
| doppler | frequency-shift | 주파수 편이 | 접근하는 적에게 더 강한 데미지 | `approachBonus`, `recedeReduction`, `shiftRange` |
| faraday | induction-field | 유도장 | 자기장 변화로 전류 생성, 연쇄 데미지 | `fieldStrength`, `inductionRate`, `chainDamage` |
| magnetic-field | magnetic-pull | 자기 흡인 | 금속 투사체/아이템을 끌어당김 | `pullRadius`, `pullStrength`, `metalBonus` |
| rotational-energy | spin-up | 회전 가속 | 회전 속도에 비례한 ½Iω² 데미지 | `momentOfInertia`, `angularVelocity`, `maxSpin` |
| beat-frequency | beat-pulse | 맥놀이 펄스 | 두 주파수의 간섭으로 주기적 강화 | `freq1`, `freq2`, `beatAmplitude` |

---

## 스킬 카테고리 분류

### 공격형 (Offensive) - 18개
- kinetic-charge, pressure-point, inverse-blast
- free-fall-strike, arc-shot, escape-burst, orbital-strike
- focus-beam, resonance-zone
- heat-transfer, radiant-aura, peak-wavelength
- power-surge, charge-release
- uncertainty-strike, quantum-leap
- decay-chain, spin-up

### 유틸리티 (Utility) - 10개
- wave-pulse, mirror-shot, matter-wave
- chaos-field, heat-chain
- resistance-drain
- concentration, catalyst
- frequency-shift, beat-pulse

### 방어/지원형 (Defensive/Support) - 7개
- energy-convert
- acid-base
- bound-state
- flow-stream, induction-field, magnetic-pull
- spin-conserve

---

## SkillLevelEffect 확장 필요

```typescript
export interface SkillLevelEffect {
    // === 기존 효과 ===
    bounceCount?: number
    pierceCount?: number
    // ... (생략)

    // === 새로운 효과 ===

    // Kinetic Charge (운동 에너지 충전)
    chargePerDistance?: number
    maxCharge?: number
    damagePerCharge?: number

    // Pressure Point (압력점)
    areaReduction?: number
    penetrationBonus?: number

    // Inverse Blast (역제곱 폭발)
    peakDamage?: number
    falloffRate?: number

    // Free Fall Strike
    fallHeight?: number
    impactRadius?: number
    gravityMultiplier?: number

    // Arc Shot (포물선)
    launchAngle?: number
    range?: number
    splashRadius?: number

    // Escape Burst
    velocityThreshold?: number
    escapeBonus?: number
    burstRadius?: number

    // Orbital Strike
    orbitCount?: number
    orbitRadius?: number
    orbitDamage?: number

    // Wave Pulse
    wavelength?: number
    amplitude?: number
    waveSpeed?: number

    // Mirror Shot
    reflectCount?: number
    reflectDamageBonus?: number

    // Focus Beam
    focalLength?: number
    focusDamageMultiplier?: number
    beamWidth?: number

    // Resonance Zone
    nodeCount?: number
    nodeRadius?: number
    nodeDamage?: number

    // Heat Transfer
    heatPerHit?: number
    maxHeat?: number
    burnDamage?: number

    // Energy Convert
    conversionRate?: number
    maxStored?: number
    releaseMultiplier?: number

    // Chaos Field
    fieldRadius?: number
    chaosStrength?: number
    durationBonus?: number

    // Heat Chain
    conductRange?: number
    conductRatio?: number
    maxChain?: number

    // Radiant Aura
    auraRadius?: number
    baseTemp?: number
    radiationDamage?: number

    // Peak Wavelength
    optimalRange?: number
    peakBonus?: number

    // Resistance Drain
    resistanceReduction?: number
    duration?: number
    stackable?: boolean

    // Power Surge
    voltage?: number
    current?: number
    surgeDamage?: number

    // Charge Release
    chargeRate?: number
    dischargeDamage?: number

    // Matter Wave
    waveSpread?: number
    interferenceBonus?: number
    pathCount?: number

    // Uncertainty Strike
    positionSpread?: number
    momentumVariance?: number

    // Quantum Leap
    energyLevels?: number[]
    transitionBonus?: number

    // Bound State
    wellWidth?: number
    boundBonus?: number
    escapePenalty?: number

    // Acid Base
    acidDamage?: number
    baseHeal?: number
    neutralBonus?: number

    // Concentration
    concentrationRate?: number
    maxConcentration?: number
    dilutionDecay?: number

    // Catalyst
    activationCondition?: string
    rateMultiplier?: number

    // Decay Chain
    decayChance?: number
    halfLife?: number
    chainRadius?: number

    // Spin Conserve
    spinSpeed?: number
    momentumRetention?: number
    spinDamageBonus?: number

    // Flow Stream
    flowSpeed?: number
    suctionForce?: number
    streamWidth?: number

    // Frequency Shift
    approachBonus?: number
    recedeReduction?: number
    shiftRange?: number

    // Induction Field
    inductionRate?: number
    chainDamage?: number

    // Magnetic Pull
    pullRadius?: number
    pullStrength?: number
    metalBonus?: number

    // Spin Up
    momentOfInertia?: number
    angularVelocity?: number
    maxSpin?: number

    // Beat Pulse
    freq1?: number
    freq2?: number
    beatAmplitude?: number
}
```

---

## 구현 우선순위

### Phase 1: 핵심 역학 스킬 (5개)
1. kinetic-charge (운동 에너지) - 기본적이고 직관적
2. mirror-shot (반사) - 기존 bounce와 유사하나 차별화
3. orbital-strike (케플러) - 비주얼 임팩트 높음
4. heat-transfer (열 전달) - DoT 메커닉 도입
5. charge-release (커패시터) - 충전/방출 메커닉

### Phase 2: 파동/광학 스킬 (5개)
6. wave-pulse (파동)
7. focus-beam (렌즈)
8. resonance-zone (정상파)
9. matter-wave (드브로이)
10. frequency-shift (도플러)

### Phase 3: 유틸리티 스킬 (5개)
11. chaos-field (엔트로피)
12. resistance-drain (옴의 법칙)
13. energy-convert (열역학 1법칙)
14. catalyst (반응 속도)
15. flow-stream (베르누이)

### Phase 4: 고급 스킬 (나머지)
- 나머지 20개 스킬

---

## 파일 구조

```
src/components/canvas/adventure/survivor/
├── skills.ts                    # 스킬 정의 (확장)
├── SkillImplementations/        # 스킬별 구현 (새로 생성)
│   ├── index.ts
│   ├── KineticChargeSkill.ts
│   ├── MirrorShotSkill.ts
│   ├── OrbitalStrikeSkill.ts
│   └── ... (51개 파일)
└── PhysicsSkillVisuals.ts       # 시각 효과 (확장)
```

---

## 다음 단계

1. SkillLevelEffect 인터페이스 확장
2. 새 스킬 35개의 SKILL_DEFINITIONS 뼈대 추가
3. Phase 1 스킬 5개 구현
4. 테스트 및 밸런싱
