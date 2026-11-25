# Приложение А. Windows и PowerShell

Книга написана так, чтобы по ней мог работать и тот, кто сидит на Linux или macOS, и тот, кто работает в Windows. Это приложение собирает всё, что относится к Windows: как ZCode выбирает оболочку, как подготовить машину, чем заменить команды Bash и как писать скрипты, которые работают везде.

## Как ZCode работает на Windows

В Linux и macOS агент выполняет команды в оболочке входа. В Windows всё зависит от того, установлен ли Git for Windows.

| Что установлено | Где агент выполняет команды |
|---|---|
| Git for Windows | В Git Bash |
| Только Git без Git Bash | В `cmd.exe` |

Таблица: Оболочка агента в ZCode на Windows. Данные из кода ZCode 4.0; в документации этот выбор не описан.

Из этого следуют три практических вывода.

- **Агент умеет Linux-команды.** В Git Bash работают `grep`, `sed`, `find` и конвейеры. Если Git Bash нет, агенту доступны только команды `cmd.exe`, и большинство примеров из интернета у него не запустятся.
- **PowerShell агенту доступна как программа.** Скрипт `.ps1` агент запускает сам, явной командой. Это надёжно работает из Git Bash и из `cmd.exe`.
- **Писать для агента команды PowerShell напрямую нельзя.** Он не поймёт синтаксис `$env:` или `Get-ChildItem`, если выполнять их будет Git Bash.

Проверить, какая оболочка у агента, можно одним вопросом.

```prompt В какой оболочке ты работаешь
Выполни команду `uname -s` и покажи её вывод. Скажи, в какой оболочке
ты выполняешь команды и какие из них у тебя точно работают:
grep, sed, find, pwsh.
```

Ответ вида `MINGW64_NT-10.0-19045` означает Git Bash. На машине, где писалась эта книга, Git for Windows установлен в нестандартную папку `C:\Program Files\GitForWindows`, и ZCode нашёл его без дополнительной настройки.

ZCode ищет Git Bash в нескольких местах (по коду ZCode 4.0): в стандартных папках `C:\Program Files\Git\bin` и `C:\Program Files (x86)\Git\bin`, затем по переменной `PATH` — через расположение `git.exe` или `git-bash.exe`, затем в `%ProgramFiles%\Git` и в папке из переменной `GIT_INSTALL_ROOT`. Если ZCode не находит Git Bash, проще всего добавить папку `cmd` установки Git в `PATH` или задать `GIT_INSTALL_ROOT`.

> Совет. Установите Git for Windows даже если сами работаете в PowerShell. Иначе агент окажется в `cmd.exe`, и многие команды из этой книги у него не пойдут.

## Подготовка машины

Для работы по книге на Windows нужны семь программ. Все они ставятся менеджером пакетов `winget`, который встроен в Windows 10 и Windows 11.

| Программа | Зачем | Пакет в winget |
|---|---|---|
| Git for Windows | Git и Git Bash для агента | `Git.Git` |
| PowerShell 7 | Скрипты `.ps1` из книги | `Microsoft.PowerShell` |
| Node.js, версия LTS | Скрипты и MCP-серверы | `OpenJS.NodeJS.LTS` |
| `glab` | Работа с GitLab из терминала | `GLab.GLab` |
| `gitleaks` | Проверка на секреты | `Gitleaks.Gitleaks` |
| Docker Desktop | Тестовые базы и изоляция | `Docker.DockerDesktop` |
| Python | Скрипты проекта, если нужны | `Python.Python.3.12` |

Таблица: Программы для Windows и их имена в winget. Для `Python.Python.3.12` имя пакета сверьтесь командой `winget search`.

Команды выполняются в PowerShell.

```powershell
winget install --id Git.Git -e
winget install --id Microsoft.PowerShell -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id GLab.GLab -e
winget install --id Gitleaks.Gitleaks -e
```

> Важно. После установки откройте новое окно терминала и ZCode: программа, запущенная раньше, не увидит обновлённую переменную `PATH`.

PowerShell по умолчанию не запускает сценарии из файлов. Разрешите их для текущего пользователя: локальные скрипты будут запускаться, скачанные — только с подписью.

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Две настройки Git избавят от части проблем с путями и переводами строк.

```powershell
git config --global core.autocrlf true
git config --global core.longpaths true
```

## Что записать в AGENTS.md

Раздел об оболочке из главы 4 для Windows расширяется до шести строк. С ними агент не пытается запускать Linux-команды там, где их нет, и сам выбирает нужный скрипт.

```markdown
## Windows и PowerShell
- На Windows команды выполняются в Git Bash, скрипты `.sh` запускай через `bash`.
- Скрипты `.ps1` запускай явно: `pwsh -NoProfile -File scripts/up.ps1`.
- Не используй `sed -i`, `chmod`, `source`, `curl | sh`: в Git Bash их может не быть.
- Пути пиши в кавычках и через `/`: в них бывают пробелы.
- `npx`, `npm` и подобные команды — это `.cmd`-файлы. В конфигурации MCP
  давай полный путь к ним.
- Если в выводе команд кракозябры, выполни `chcp 65001` и повтори.
```

> Совет. Заведите такой раздел и для Linux, даже если вся команда работает в Windows. В CI команды выполняются в Linux-контейнере, и агент должен знать, что там правила другие.

## Шпаргалка: Bash и PowerShell

Во всех главах книги команды даются парой. Здесь собраны соответствия, которые встречаются чаще всего. Правая колонка полезна и тогда, когда вы сами работаете в PowerShell, а агент приготовил команды для Bash.

| Задача | Bash | PowerShell |
|---|---|---|
| Перейти в папку | `cd путь` | `Set-Location путь` |
| Список файлов | `ls -la` | `Get-ChildItem -Force` |
| Показать файл | `cat файл` | `Get-Content файл` |
| Последние строки файла | `tail -n 20 файл` | `Get-Content файл -Tail 20` |
| Найти файлы | `find . -name "*.ts"` | `Get-ChildItem -Recurse -Filter *.ts` |
| Найти текст | `grep -rn "текст" src` | `Get-ChildItem src -Recurse` затем `Select-String "текст"` |
| Где лежит программа | `command -v node` | `Get-Command node` |
| Создать папку | `mkdir -p a/b` | `New-Item -ItemType Directory -Force a/b` |
| Копировать папку | `cp -r src dst` | `Copy-Item src dst -Recurse` |
| Удалить папку | `rm -rf папка` | `Remove-Item папка -Recurse -Force` |
| Задать переменную | `export X="1"` | `$env:X = "1"` |
| Показать переменные | `env` | `Get-ChildItem Env:` |
| Заменить текст в файле | `sed -i 's/а/б/g' файл` | `Get-Content`, оператор `-replace`, `Set-Content` |
| Скачать файл | `curl -L -o f.zip адрес` | `Invoke-WebRequest адрес -OutFile f.zip` |
| Сделать файл исполняемым | `chmod +x script.sh` | Не требуется |
| Цепочка команд | `a && b` | `a; if ($?) { b }`, в PowerShell 7 тоже `a && b` |
| Код выхода | `echo $?` | `$LASTEXITCODE` |
| Текущая папка | `$(pwd)` | `$(Get-Location)` |
| Домашняя папка | `$HOME` | `$HOME` |

Таблица: Соответствие команд Bash и PowerShell.

Три различия запоминаются труднее остальных.

- **Переменные окружения.** В Bash они задаются через `export`, в PowerShell — через `$env:`. Конструкция `$env:GITLAB_TOKEN` в Bash означает совсем другое.
- **Код выхода.** В PowerShell `$?` отвечает на вопрос «была ли ошибка», а код выхода последней программы лежит в `$LASTEXITCODE`. Проверяйте именно его.
- **Перенаправление вывода.** Запись `>` в Windows PowerShell 5.1 сохраняет файл в кодировке UTF-16. Чтобы получить UTF-8, используйте `Out-File -Encoding utf8` или PowerShell 7.

## Скрипты: два варианта или один общий

В книге рекомендовался один скрипт подъёма на Node.js, который одинаково работает везде. Если в команде приняты раздельные скрипты, PowerShell-версия выглядит так.

```powershell
# scripts/up.ps1 — поднимает проект с нуля в Windows.
$ErrorActionPreference = "Stop"

function Invoke-Step($label, $command, $arguments) {
    $out = & $command @arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Шаг «$label» не выполнен: $command $($arguments -join ' ')"
        $out | Select-Object -Last 15 | Write-Host
        exit 1
    }
}

Invoke-Step "установка зависимостей" "npm" @("ci")
Invoke-Step "миграции" "npm" @("run", "db:migrate")
Invoke-Step "тестовые данные" "npm" @("run", "db:seed")
Write-Host "Готово. Приложение: http://localhost:3000"
```

Требования к скрипту те же, что в главе 6: повторный запуск ничего не ломает, успешные шаги не печатаются, при ошибке видно, какой шаг не выполнен.

## Хуки ZCode на Windows

Хуки в ZCode запускаются одним из двух способов. Способ `process` выполняет программу с аргументами напрямую, без оболочки. Способ `command` передаёт всю строку системной оболочке, и на Windows это будет не Bash. Поэтому для команд, где есть Windows, выбирайте `process`: он работает одинаково на всех системах.

Два варианта хука после правки были приведены в главе 7: кроссплатформенный на Node.js и вариант на PowerShell. То же самое для хука, который требует подтверждения на команды с продакшеном.

```powershell
# scripts/hooks/prod-gate.ps1 — хук PreToolUse для Windows.
$raw = [Console]::In.ReadToEnd()
$event = $raw | ConvertFrom-Json
if ($event.tool_name -ne 'Bash') { exit 0 }
$cmd = [string]$event.tool_input.command

# Имена ваших прод-окружений, контекстов и баз. Впишите свои.
$prod = '--project=\S*prod\S*', '--context=\S*prod\S*', 'psql\S* .*prod',
        'terraform apply', 'deploy\.sh'

foreach ($pattern in $prod) {
    if ($cmd -match $pattern) {
        $reply = @{ hookSpecificOutput = @{
            hookEventName = 'PreToolUse'
            permissionDecision = 'ask'
            permissionDecisionReason = 'Команда идёт в прод. Подтвердите её лично.'
        } }
        [Console]::Out.Write(($reply | ConvertTo-Json -Compress -Depth 4))
        exit 0
    }
}
exit 0
```

Хук на PowerShell регистрируется так.

```json
{
  "type": "process",
  "command": "pwsh",
  "args": ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
           "scripts/hooks/prod-gate.ps1"],
  "onError": "deny"
}
```

Три замечания по этой конфигурации.

- `-ExecutionPolicy Bypass` запускает скрипт независимо от политики выполнения и избавляет от лишних вопросов.
- Поле `onError` со значением `deny` превращает падение самого хука в запрет команды. Скрипт не должен падать из-за пустяков.
- Хуки проекта требуют подтверждения кнопкой Trust, а изменения подхватываются новой задачей или командой `/reload`. Это одинаково на всех системах.

## Git-хуки на Windows

Git для Windows выполняет хуки через собственную оболочку, даже если сами вы работаете в PowerShell. Поэтому хук пишется как маленький сценарий для этой оболочки, а всю работу он передаёт общему скрипту проверок. Хук ниже выбирает скрипт по системе.

```text
#!/bin/sh
# Хук перед коммитом: общая проверка для Linux, macOS и Windows.
if command -v pwsh >/dev/null 2>&1 && [ -f scripts/check.ps1 ]; then
  pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/check.ps1
else
  bash scripts/check.sh
fi
```

Хуки удобно держать в папке репозитория и подключать одной командой. Она одинакова во всех оболочках.

```text
git config core.hooksPath .githooks
```

Инструменты pre-commit, lefthook и husky учитывают особенности Windows сами. Для husky нужен установленный Git Bash.

## MCP-серверы на Windows

Локальные MCP-серверы чаще всего запускаются через `npx`. В Windows это файл `npx.cmd`, и не всякий запуск найдёт его по короткому имени. Если ZCode сообщает, что процесс не удалось запустить, укажите полный путь.

Узнать его можно командой в PowerShell.

```powershell
(Get-Command npx).Source
```

В конфигурации путь записывается с удвоенными обратными слешами.

```json
{
  "mcp": {
    "servers": {
      "memory": {
        "command": "C:\\Program Files\\nodejs\\npx.cmd",
        "args": ["-y", "@modelcontextprotocol/server-memory"],
        "env": {}
      }
    }
  }
}
```

> Совет. Полный путь у каждого разработчика свой, поэтому в конфигурацию проекта его класть нельзя. Такой сервер заводится в области User на каждой машине отдельно.

## Кодировки и переводы строк

Две проблемы портят настроение на Windows чаще остальных.

**Кракозябры вместо русских букв.** Консоль Windows по умолчанию работает в однобайтовой кодировке. На время сеанса помогает `chcp 65001`. Навсегда — PowerShell 7 и строка в профиле, который открывается командой `notepad $PROFILE`.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

**Разные переводы строк.** Windows использует `CRLF`, Linux и macOS — `LF`. Чтобы файлы не менялись при каждом коммите, добавьте в корень репозитория файл `.gitattributes`.

```text
* text=auto eol=lf
*.ps1 text eol=crlf
*.cmd text eol=crlf
```

## Изоляция для рискованных задач

Для режимов без подтверждений агенту нужна изолированная среда: контейнер или виртуальная машина, откуда в интернет открыты только необходимые адреса и куда не положены ключи от продакшена. В Windows эту роль берут Docker Desktop и WSL2.

ZCode умеет работать с кодом и командами в удалённой среде: SSH, WSL или Docker. Настройка находится в документации ZCode в разделе Remote Development. Там же говорится, что локальные пользовательские скиллы на удалённую машину нужно синхронизировать отдельно.

## Типичные проблемы

| Симптом | Причина | Что сделать |
|---|---|---|
| Агент пишет «команда не найдена» на `grep` или `sed` | Git Bash не найден, агент работает в `cmd.exe` | Установите Git for Windows или добавьте его в `PATH` |
| MCP-сервер не запускается | `npx` не найден по короткому имени | Укажите полный путь к `npx.cmd` в области User |
| Скрипт `.ps1` не запускается | Политика выполнения запрещает скрипты | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Файлы показываются как изменённые сразу после клонирования | Разные переводы строк | Файл `.gitattributes` в корне репозитория |
| «Путь не найден» на длинных путях | Лимит длины пути в Windows | `git config --global core.longpaths true` |
| Русский текст в выводе читается неправильно | Кодировка консоли | `chcp 65001`, PowerShell 7, строка в профиле |
| Хук Git молчит | Хуки лежат не там, где Git их ищет | `git config core.hooksPath .githooks` |

Таблица: Частые проблемы на Windows и их решения.

> Совет. Если в команде есть хотя бы один человек на Windows, заведите правило: каждая новая инструкция для агента проверяется на обеих системах. Иначе половина команды получит скрипты и команды, которые у неё не работают.
