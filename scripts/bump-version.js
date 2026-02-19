#!/usr/bin/env node

/**
 * 버전 자동 증가 스크립트
 * - package.json version: patch 버전 증가 (0.0.1 → 0.0.2)
 * - versionCode: 매 빌드마다 1씩 증가
 * - versionName: package.json의 version과 동기화
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const buildGradlePath = join(rootDir, 'android/app/build.gradle');
const packageJsonPath = join(rootDir, 'package.json');

// package.json 읽기 및 버전 증가
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// patch 버전 증가 (0.0.1 → 0.0.2)
const versionParts = currentVersion.split('.');
versionParts[2] = parseInt(versionParts[2], 10) + 1;
const newVersion = versionParts.join('.');

// package.json 업데이트
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// build.gradle 읽기
let buildGradle = readFileSync(buildGradlePath, 'utf8');

// 현재 versionCode 추출
const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
if (!versionCodeMatch) {
    console.error('versionCode를 찾을 수 없습니다.');
    process.exit(1);
}

const currentVersionCode = parseInt(versionCodeMatch[1], 10);
const newVersionCode = currentVersionCode + 1;

// versionCode 업데이트
buildGradle = buildGradle.replace(
    /versionCode\s+\d+/,
    `versionCode ${newVersionCode}`
);

// versionName 업데이트 (새로운 package.json 버전과 동기화)
buildGradle = buildGradle.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${newVersion}"`
);

// build.gradle 저장
writeFileSync(buildGradlePath, buildGradle);

console.log(`버전 업데이트 완료:`);
console.log(`  package.json: ${currentVersion} → ${newVersion}`);
console.log(`  versionCode: ${currentVersionCode} → ${newVersionCode}`);
console.log(`  versionName: "${newVersion}"`);
