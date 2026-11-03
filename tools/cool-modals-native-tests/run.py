#!/usr/bin/env python3
"""Compile the production modal adapter with UIKit and narrow RN boundary spies."""
import argparse
import hashlib
import json
import plistlib
import re
import shutil
import subprocess
import time
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--artifacts', type=Path, required=True)
parser.add_argument('--panmodal', type=Path, required=True)
parser.add_argument('--baseline', help='Git revision to compare, rather than working files')
parser.add_argument('--device', required=True, help='Explicit simulator UDID')
args = parser.parse_args()
tests = Path(__file__).resolve().parent
repo = tests.parents[1]
variant = 'baseline' if args.baseline else 'candidate'
out = args.artifacts / variant
include = out / 'include'
source = out / 'source'
for path in [include / 'React', source]:
    path.mkdir(parents=True, exist_ok=True)


def run(command, **kwargs):
    command = [str(value) for value in command]
    result = subprocess.run(command, capture_output=True, text=True, **kwargs)
    with (out / 'commands.log').open('a') as log:
        log.write(json.dumps(command) + '\n' + result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout.strip()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_bytes(relative):
    if args.baseline:
        return subprocess.check_output(['git', 'show', args.baseline + ':' + relative], cwd=repo)
    return (repo / relative).read_bytes()


for name in ['RNCMScreen.h', 'RNCMScreen.m', 'RNCMScreenStack.h',
             'RNCMScreenStack.m', 'UIViewController+slack.swift']:
    (source / name).write_bytes(source_bytes('src/react-native-cool-modals/ios/' + name))
shutil.copyfile(tests / 'ReactBoundary.h', include / 'ReactBoundary.h')
for name in ['RCTViewManager', 'RCTView', 'RCTComponent', 'RCTUIManager', 'RCTShadowView',
             'RCTTouchHandler', 'RCTInvalidating', 'RCTBridge', 'RCTUIManagerUtils', 'RCTRootContentView']:
    (include / 'React' / (name + '.h')).write_text('#import "ReactBoundary.h"\n')
(include / 'Bridge.h').write_text('''#import "ReactBoundary.h"
#import "RNCMScreen.h"
#import "RNCMScreenStack.h"
@interface RNCMScreenView (TestInitializer)
- (instancetype)initWithBridge:(RCTBridge *)bridge;
- (void)invalidate;
@end
''')

sdk = run(['xcrun', '--sdk', 'iphonesimulator', '--show-sdk-path'])
target = 'arm64-apple-ios17.0-simulator'
module = args.artifacts / 'PanModal'
module.mkdir(exist_ok=True)
podfile = source_bytes('ios/Podfile').decode()
pin = re.search(r"pod [\"']PanModal[\"'].*?:commit\s*=>\s*[\"']([0-9a-f]{40})[\"']", podfile)
if not pin:
    raise RuntimeError('Selected Podfile does not pin a PanModal commit')
expected = pin.group(1)
pan_sources = sorted((args.panmodal / 'PanModal').rglob('*.swift'))
for path in pan_sources:
    relative = path.relative_to(args.panmodal)
    pinned = subprocess.check_output(['git', 'show', expected + ':' + str(relative)], cwd=args.panmodal)
    if path.read_bytes() != pinned:
        raise RuntimeError('PanModal source differs from Podfile pin: ' + str(relative))
pan_manifest = {str(path.relative_to(args.panmodal)): sha(path) for path in pan_sources}
run(['xcrun', 'swiftc', '-O', '-sdk', sdk, '-target', target,
     '-emit-library', '-emit-module', '-module-name', 'PanModal',
     '-emit-module-path', module / 'PanModal.swiftmodule',
     '-Xlinker', '-install_name', '-Xlinker', '@rpath/libPanModal.dylib',
     *pan_sources, '-o', module / 'libPanModal.dylib'])

swift = ['xcrun', 'swiftc', '-O', '-sdk', sdk, '-target', target, '-module-name', 'Rainbow',
         '-I', include, '-I', source, '-I', module, '-import-objc-header', include / 'Bridge.h']
swift_sources = [source / 'UIViewController+slack.swift', tests / 'main.swift']
run([*swift, '-emit-module', '-emit-module-path', out / 'Rainbow.swiftmodule',
     '-emit-objc-header', '-emit-objc-header-path', include / 'Rainbow-Swift.h', *swift_sources])
clang = ['xcrun', 'clang', '-fobjc-arc', '-fmodules', '-Werror=incompatible-pointer-types',
         '-isysroot', sdk, '-target', target, '-I', include, '-I', source]
run([*clang, '-fsyntax-only', source / 'RNCMScreenStack.m'])
objects = []
for path in [source / 'RNCMScreen.m', tests / 'ReactBoundary.m']:
    obj = out / (path.stem + '.o')
    run([*clang, '-O2', '-c', path, '-o', obj])
    objects.append(obj)

app = out / 'ContainmentProof.app'
(app / 'Frameworks').mkdir(parents=True, exist_ok=True)
run([*swift, *swift_sources, *objects, '-L', module, '-lPanModal',
     '-Xlinker', '-rpath', '-Xlinker', '@executable_path/Frameworks', '-o', app / 'ContainmentProof'])
shutil.copyfile(module / 'libPanModal.dylib', app / 'Frameworks/libPanModal.dylib')
bundle = 'dev.codex.cool-modals-containment-proof'
(app / 'Info.plist').write_bytes(plistlib.dumps({
    'CFBundleIdentifier': bundle, 'CFBundleExecutable': 'ContainmentProof',
    'CFBundleName': 'Containment Proof', 'CFBundlePackageType': 'APPL',
    'CFBundleVersion': '1', 'CFBundleShortVersionString': '1',
    'LSRequiresIPhoneOS': True, 'UILaunchScreen': {}, 'UIDeviceFamily': [1]
}))
run(['codesign', '-s', '-', app / 'Frameworks/libPanModal.dylib'])
run(['codesign', '-s', '-', app])
fixture_files = ['main.swift', 'ReactBoundary.h', 'ReactBoundary.m', 'run.py']
receipt = {
    'variant': variant, 'revision': args.baseline, 'sdk': sdk, 'target': target, 'device': args.device,
    'sources': {path.name: sha(path) for path in source.iterdir()},
    'fixture': {name: sha(tests / name) for name in fixture_files},
    'panmodal_commit': expected, 'panmodal': pan_manifest,
    'panmodal_binary_sha256': sha(app / 'Frameworks/libPanModal.dylib'),
    'executable_sha256': sha(app / 'ContainmentProof')
}
(out / 'receipt.json').write_text(json.dumps(receipt, indent=2))
snapshot = args.artifacts / 'snapshots' / receipt['executable_sha256']
snapshot.mkdir(parents=True, exist_ok=True)
shutil.copytree(source, snapshot / 'source', dirs_exist_ok=True)
for path in [*[tests / name for name in fixture_files], out / 'receipt.json', app / 'ContainmentProof']:
    shutil.copyfile(path, snapshot / path.name)

run(['xcrun', 'simctl', 'install', args.device, app])
installed = Path(run(['xcrun', 'simctl', 'get_app_container', args.device, bundle, 'app']))
if sha(installed / 'ContainmentProof') != receipt['executable_sha256']:
    raise RuntimeError('Installed executable differs from compiled artifact')
if sha(installed / 'Frameworks/libPanModal.dylib') != receipt['panmodal_binary_sha256']:
    raise RuntimeError('Installed PanModal differs from compiled artifact')
data = Path(run(['xcrun', 'simctl', 'get_app_container', args.device, bundle, 'data'])) / 'Documents/result.json'
data.unlink(missing_ok=True)
run(['xcrun', 'simctl', 'launch', '--terminate-running-process', args.device, bundle,
     *(['contract'] if args.baseline else [])])
for _ in range(400):
    if data.exists():
        break
    time.sleep(.05)
else:
    raise RuntimeError('No result from native fixture')
result = json.loads(data.read_text())
result['receipt'] = receipt
(out / 'result.json').write_text(json.dumps(result, indent=2))
shutil.copyfile(out / 'result.json', snapshot / 'result.json')
run(['xcrun', 'simctl', 'terminate', args.device, bundle])
shutil.copyfile(out / 'commands.log', snapshot / 'commands.log')
print(json.dumps(result['checks'], indent=2))
failures = [check['name'] for check in result['checks'] if not check['pass']]
if failures and not args.baseline:
    raise SystemExit('Native assertions failed: ' + ', '.join(failures))
if args.baseline:
    contract_failures = {
        'wrapper owns loaded root', 'wrapper root is distinct from child',
        'native containment identifies child', 'React frame cannot resize native child',
        'native root resizes child'
    }
    if not failures or not set(failures).issubset(contract_failures):
        raise SystemExit('Baseline must detect containment failure with all setup/control checks passing')
