# 스킬 구현 계획

## 스킬 유형 분류

### Type A: 패시브 스탯 수정 (가장 간단)
항상 활성화, 스탯만 변경하면 됨

| 스킬 | 공식 | 효과 | 구현 난이도 |
|------|------|------|-------------|
| frequency-burst | E=hf | 발사 속도 증가 | ⭐ |
| mass-impact | F=ma | 데미지/넉백 증가 | ⭐ |
| kinetic-charge | KE=½mv² | 이동 시 차지, 데미지 증가 | ⭐⭐ |
| pressure-point | P=F/A | 관통력 증가 | ⭐ |

### Type B: 투사체 수정 (중간 난이도)
투사체 동작 방식 변경

| 스킬 | 공식 | 효과 | 구현 난이도 |
|------|------|------|-------------|
| elastic-bounce | 탄성충돌 | 벽/적에게 튕김 | ⭐⭐ (구현됨) |
| momentum-pierce | p=mv | 관통 | ⭐⭐ (구현됨) |
| pressure-wave | PV=nRT | 폭발 | ⭐⭐ (구현됨) |
| gravity-pull | F=Gmm/r² | 유도 | ⭐⭐ (구현됨) |
| spread-shot | 확산 | 다중 발사 | ⭐⭐ (구현됨) |
| arc-shot | 포물선 | 곡선 궤적 | ⭐⭐⭐ |
| mirror-shot | 반사 | 특정 각도로 반사 | ⭐⭐ |
| orbital-strike | 케플러 | 궤도 도는 탄환 | ⭐⭐⭐ |

### Type C: 주기적 패시브 (쿨다운 자동 발동)
일정 시간마다 자동 발동

| 스킬 | 공식 | 효과 | 구현 난이도 |
|------|------|------|-------------|
| centrifugal-pulse | 원심력 | 주기적 충격파 | ⭐⭐ (구현됨) |
| wave-pulse | 파동 | 확산 웨이브 | ⭐⭐ |
| radiant-aura | 복사 | 주변 지속 데미지 | ⭐⭐ |
| beat-pulse | 맥놀이 | 주기적 데미지 펄스 | ⭐⭐ |
| pendulum-rhythm | 진자 | 데미지 주기적 증감 | ⭐⭐ |

### Type D: 플레이어 주변 효과 (영역 스킬)
플레이어 주변에 지속 효과

| 스킬 | 공식 | 효과 | 구현 난이도 |
|------|------|------|-------------|
| magnetic-shield | 로렌츠 | 적 편향 | ⭐⭐⭐ |
| static-repulsion | 쿨롱 | 적 밀어내기 | ⭐⭐ |
| time-warp | 시간지연 | 적 슬로우 | ⭐⭐ |
| chaos-field | 엔트로피 | 적 경로 혼란 | ⭐⭐⭐ |
| flow-stream | 베르누이 | 적 끌어당김 | ⭐⭐ |

### Type E: 조건부 트리거 (특정 조건에서 발동)
특정 상황에서 자동 발동

| 스킬 | 공식 | 효과 | 구현 난이도 |
|------|------|------|-------------|
| quantum-tunnel | 터널링 | 확률로 벽 통과 | ⭐⭐⭐ |
| escape-burst | 탈출속도 | 빠른 이동 시 폭발 | ⭐⭐⭐ |
| decay-chain | 방사성붕괴 | 적 사망 시 연쇄 | ⭐⭐⭐ |
| heat-chain | 열전도 | 데미지 연쇄 전달 | ⭐⭐⭐ |

### Type F: 회전/근접 무기 (지속 효과)
플레이어 주변에 무기 회전

| 스킬 | 공식 | 효과 | 구현 난이도 |
|------|------|------|-------------|
| torque-slash | 토크 | 회전 칼날 | ⭐⭐⭐ (구현됨) |
| spin-conserve | 각운동량 | 회전 유지 무기 | ⭐⭐⭐ |
| rotational-energy | 회전에너지 | 스핀 차지 공격 | ⭐⭐⭐ |

---

## 구현 우선순위 (1차)

### 1단계: 이미 구현된 스킬 확인 및 밸런싱
- [x] elastic-bounce (탄성 충돌)
- [x] momentum-pierce (관통)
- [x] pressure-wave (폭발)
- [x] frequency-burst (발사 속도)
- [x] mass-impact (데미지/넉백)
- [x] gravity-pull (유도)
- [x] spread-shot (확산)
- [x] centrifugal-pulse (충격파)

### 2단계: 간단한 패시브 추가
- [ ] kinetic-charge (이동 차지)
- [ ] pressure-point (관통력)
- [ ] time-warp (슬로우 필드)
- [ ] static-repulsion (밀어내기)

### 3단계: 주기적 스킬 추가
- [ ] wave-pulse (웨이브)
- [ ] radiant-aura (오라)
- [ ] pendulum-rhythm (진자 리듬)

### 4단계: 조건부 스킬 추가
- [ ] escape-burst (탈출 폭발)
- [ ] decay-chain (연쇄 폭발)
- [ ] heat-chain (연쇄 전달)

---

## 스킬 동작 방식 정의

### 패시브 스탯 (Type A)
```typescript
// calculateCombinedSkillStats에서 처리
// 게임 루프에서 자동 적용
```

### 투사체 수정 (Type B)
```typescript
// ProjectileSystem.fire()에서 스킬 스탯 참조
// 투사체 생성 시 속성 부여
```

### 주기적 패시브 (Type C)
```typescript
// PhysicsSurvivorScene.animatePlay()에서 타이머 관리
// 타이머 만료 시 효과 발동
skillTimers: Map<string, number>

if (skillStats.waveInterval > 0) {
    this.waveTimer -= deltaSeconds
    if (this.waveTimer <= 0) {
        this.emitWave()
        this.waveTimer = skillStats.waveInterval
    }
}
```

### 영역 효과 (Type D)
```typescript
// updateWorldEntities()에서 주변 적에게 효과 적용
for (const enemy of this.enemies) {
    const dist = distance(player, enemy)
    if (dist < skillStats.slowRadius) {
        enemy.speed *= skillStats.slowFactor
    }
}
```

### 조건부 트리거 (Type E)
```typescript
// 특정 이벤트에서 체크
onEnemyDeath(enemy) {
    if (Math.random() < skillStats.decayChance) {
        this.createChainExplosion(enemy.x, enemy.y)
    }
}
```
