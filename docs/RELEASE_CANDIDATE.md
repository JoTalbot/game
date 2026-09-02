# ИГРА — Release Candidate gate

## Product

- 3 содержательных акта: первый, второй, третий.
- Минимум 3 жизненные траектории: bonding, steward/balanced, severing.
- Минимум 3 финальных world-state через `release`, `become` и накопленную экологическую/телесную историю.
- 8 исторических мест с повторными посещениями.
- 6 повторяющихся идентичностей существ.
- 5+ длинных причинных цепочек через `causeId`.
- 10 редких персональных событий, без коллекционного интерфейса.
- Полный цикл `life → finale → next life`.
- Финал не закрывает игру и не требует NG+ экрана.

## Technical

- Все долговечные данные имеют версию.
- Причины и события используют bounded history.
- Старые следы сжимаются, а не растут бесконечно.
- Migration принимает старый/частично неполный save без падения.
- `release-systems.js` подключён в browser shell и service-worker cache.
- Offline core не зависит от сети.
- Deterministic control scenarios покрывают контрастные маршруты и финал.

## UX / platform

- Touch-first управление остаётся основным.
- Haptic/audio деградируют без аппаратной поддержки.
- Нет обязательных ads, network, FOMO, streak, daily reward или monetization gates.
- Android save переживает process death через нативный backend.
- Browser save имеет localStorage fallback.
- RU/EN shell продолжает работать.
- Save/report/sigil экраны не получают обязательных meta-progression панелей.

## Release gate

1. `life.yml` — все probes green.
2. `apk.yml` — debug/release build green на чистом checkout.
3. RC probe — green.
4. Clean install — boot, birth, play, save, restart.
5. Upgrade — старый save → новая версия → продолжение.
6. Process death — сохранение не теряется.
7. Offline — shell и core loop открываются без сети.
8. Artifact существует и имеет checksum.
9. Нет critical/blocker.
10. После прохождения всех пунктов создаётся release tag и только затем начинается Play submission.

## Important

RC не означает «финал разработки навсегда». Это замороженная проверяемая версия, которую можно отдавать на ручное принятие и подготовку публикации. Исправления blocker/critical разрешены, новые продуктовые механики после freeze — только через новый backlog item.
