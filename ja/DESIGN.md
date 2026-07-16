# ゲームエンジン設計書

## 1. 設計目標

このエンジンは、ブラウザ中心で動作するコンポーネントベースの基盤として設計する。

主な目標は次のとおり。

- コアを小さく理解しやすく保つ
- 制御、状態、振る舞いを分離する
- ライフサイクルルールを明確にする
- 将来の描画、物理、ネットワークに拡張しやすくする
- Rust/WASM と共有プロトコル統合への道筋を残す

## 2. システム概要

### 2.1 レイヤー構成

```text
Application Layer
  -> Game API Layer
  -> Engine Core Layer
  -> Rendering / Physics / Resource Layer
  -> WASM Runtime Layer
  -> Browser / Hardware
```

### 2.2 コアモジュール

- `core`: エンジン制御とゲームループ
- `scene`: シーン登録と切り替え
- `object`: GameObject の所有と階層
- `component`: ライフサイクル管理付きの振る舞い
- `math`: 基本ベクトル、クォータニオン、行列
- `rendering`: 描画パイプライン接続
- `input`: キーボードとポインタ入力
- `resource`: アセット読み込みとキャッシュ
- `wasm`: WASM 実行ブリッジ

## 3. クラスモデル

### 3.1 関係の要約

```text
Engine
  -> SceneManager
  -> Time

SceneManager
  -> Scene

Scene
  -> GameObject

GameObject
  -> Component
  -> Transform
  -> Child GameObject[]
```

### 3.2 責務一覧

#### Engine

- ゲームループを開始・停止・駆動する
- SceneManager とタイミング管理を所有する
- update と render の流れを統括する

#### SceneManager

- シーンを登録する
- アクティブシーンを切り替える
- update と render を中継する

#### Scene

- GameObject 群を保持する
- 含まれるオブジェクトを有効化・無効化する
- アクティブなオブジェクトを update / render する

#### GameObject

- ゲーム世界の 1 つの実体を表す
- Component と子オブジェクトを保持する
- 必ず `Transform` を持つ

#### Component

- ライフサイクル駆動で振る舞いを提供する
- `start`、`update`、`render`、`destroy` を持つ
- 有効化と破棄の安全性を担保する

## 4. 推奨フォルダ構成

```text
src/
  engine/
    core/
      Engine.ts
      GameLoop.ts
      Time.ts
      EngineContext.ts
    scene/
      Scene.ts
      SceneManager.ts
    object/
      GameObject.ts
      ObjectId.ts
    component/
      Component.ts
      Transform.ts
      ScriptComponent.ts
      CameraComponent.ts
      LightComponent.ts
      RendererComponent.ts
    math/
      Vector2.ts
      Vector3.ts
      Quaternion.ts
      Matrix4.ts
    rendering/
      Renderer.ts
      RenderContext.ts
      Mesh.ts
      Material.ts
      Shader.ts
    input/
      InputManager.ts
      KeyboardInput.ts
      PointerInput.ts
    resource/
      ResourceManager.ts
      Resource.ts
      ResourceLoader.ts
    events/
      EventEmitter.ts
      EngineEvent.ts
    wasm/
      WasmRuntime.ts
      WasmMemory.ts
  application/
    Game.ts
    MainScene.ts
  index.ts
tests/
```

## 5. 主要インターフェース

### 5.1 Engine

```ts
export interface EngineOptions {
  targetFps?: number;
  canvas?: HTMLCanvasElement;
}

export class Engine {
  public initialize(): void;
  public start(): void;
  public stop(): void;
  public getSceneManager(): SceneManager;
}
```

### 5.2 SceneManager

```ts
export class SceneManager {
  public addScene(scene: Scene): void;
  public changeScene(name: string): void;
  public update(deltaTime: number): void;
  public render(): void;
  public getCurrentScene(): Scene | null;
}
```

### 5.3 Scene

```ts
export class Scene {
  public constructor(public readonly name: string);
  public enter(): void;
  public exit(): void;
  public addObject(gameObject: GameObject): void;
  public removeObject(id: string): boolean;
  public update(deltaTime: number): void;
  public render(): void;
}
```

### 5.4 GameObject

```ts
export class GameObject {
  public readonly id: string;
  public readonly transform: Transform;

  public constructor(name: string);
  public addComponent<T extends Component>(component: T): T;
  public getComponent<T extends Component>(type: new (...args: never[]) => T): T | null;
  public removeComponent(component: Component): boolean;
  public addChild(child: GameObject): void;
  public removeChild(child: GameObject): boolean;
  public activate(): void;
  public deactivate(): void;
  public update(deltaTime: number): void;
  public render(): void;
  public destroy(): void;
}
```

### 5.5 Component

```ts
export abstract class Component {
  public owner: GameObject | null = null;
  public enabled = true;

  public internalStart(): void;
  public internalUpdate(deltaTime: number): void;
  public internalRender(): void;
  public internalDestroy(): void;

  protected start(): void;
  protected update(_deltaTime: number): void;
  protected render(): void;
  protected destroy(): void;
}
```

## 6. ライフサイクル規則

### 6.1 有効化フロー

1. Component を生成する
2. Component を GameObject に追加する
3. GameObject を Scene に追加する
4. Scene を有効化する
5. Component の `start` が 1 回だけ実行される

## 7. Editor UI 設計原則

UI は機能追加のたびに見た目が崩れないよう、共通ルールを先に固定する。

### 7.1 基本方針

- 画面ごとに独自の並びを増やさず、共通の部品を再利用する
- 見出し、説明、入力群の順序を揃える
- 1 つの設定群は 1 つの見出しにまとめる
- 2D と 3D で必要な軸の数を明示的に分ける
- Inspector は縦方向に読みやすく、横幅が狭くても崩れない構造にする

### 7.2 表示ルール

- `Transform` のような基本項目は `Position / Rotation / Scale` の単位で統一する
- 軸入力は `X / Y / Z` の順序を固定する
- 2D オブジェクトは `X / Y` を基本とし、`Z` は重なり順や深度として扱う
- 画像や複合オブジェクトは `プレビュー -> 設定 -> ファイル` の順で並べる
- 折りたたみ可能な項目は、同じコンポーネント形式を使う

### 7.3 ADVMNG の扱い

- ADVMNG は独自 UI を増やしすぎず、PNG と同じルールで構成する
- ADVMNG は単一の PNG 専用コンテナではなく、子アセットを束ねるコンテナとして扱う
- 初期実装では PNG を主対象にするが、VRM や他のアセットも子要素としてぶら下げられる前提にする
- 子要素ごとの位置、サイズ、Z-Index、表示状態は同じ入力パターンで編集できるようにする
- 子要素の種類ごとに Inspector の詳細項目は差し替え可能にする
- モーダル編集画面と Inspector の項目名を一致させる

### 7.4 VRM Pose の扱い

- VRM のポーズ編集は Inspector に詰め込まず、`VRM Editor` の中の専用領域として扱う
- `VRM Editor` は 1 画面内でモーション一覧、プレビュー、詳細編集を完結させる
- 標準ポーズは `T-pose` ではなく、待機ポーズ `Idle / Wait` を基準姿勢として扱う
- まずは `Reset Pose`、`Preset Pose`、`Save / Load` を基本機能とする
- 詳細な骨回転、手指、表情の調整は、同じ画面の右ペインで行う
- ポーズデータは JSON で保存し、モデル本体とは分離して管理する
- Scene View は結果確認に使い、編集の主操作は VRM Editor に寄せる
- ここで扱うポーズは、試作の見た目補助ではなく、実モーション再生の基礎データとして扱う
- `Bone Mapping` は一時的な補助機能として扱い、最終的には VRM の実ボーン構造に対するリターゲットへ移行する

### 7.5 VRM モーションの名前管理

VRM のモーションは、スクリプト参照用の安定 ID と、編集画面で見える表示名を分ける。

- `id`
  - スクリプトが参照する固定識別子
  - ファイル名や登録順に依存しない
  - 例: `dataset_bow_active_001`, `dataset_bye_active_001`
- `alias`
  - 専用画面で人間が付ける別名
  - シーンや作品ごとに見やすい名前を付ける
  - 例: `おじぎ`, `さようなら`
- `displayName`
  - モーション一覧や Inspector に表示する名前
  - `alias` があれば優先し、なければ `id` を短く整形して使う

VRM Editor では次の操作を提供する。

- モーション一覧を表示する
- 選択中モーションの `id` と `alias` を確認・編集する
- スクリプトから参照するためのコピー操作を用意する
- `Play / Stop / Loop / Seek` を試しながら名前を登録する

保存形式は JSON とし、次のような構造を基本とする。

```json
{
  "vrmId": "hero_001",
  "motions": [
    {
      "id": "dataset_bow_active_001",
      "alias": "おじぎ",
      "displayName": "Bow Active",
      "source": "https://raw.githubusercontent.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset/master/dataset/Bandai-Namco-Research-Motiondataset-1/data/dataset-1_bow_active_001.bvh",
      "loop": false
    },
    {
      "id": "dataset_bye_active_001",
      "alias": "さようなら",
      "displayName": "Bye Active",
      "source": "https://raw.githubusercontent.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset/master/dataset/Bandai-Namco-Research-Motiondataset-1/data/dataset-1_bye_active_001.bvh",
      "loop": false
    }
  ]
}
```

スクリプト側は `id` を第一選択とし、`alias` は補助的な参照名として扱う。
これにより、表示名を変更してもゲームロジックは壊れにくくなる。

### 7.6 レイアウト制約

- 画面全体はスクロールさせず、必要な領域だけを内部スクロールにする
- Scene View は FullHD で全体が入る高さを基本にする
- Inspector は必要に応じてスクロール可能にする
- 同じ意味の操作は、どの画面でも同じ部品と文言を使う

### 7.7 VRM Editor の画面構成

VRM Editor は、VRM の確認とモーション登録を行う専用画面とする。

基本レイアウトは次の 3 分割を基準にする。

- 左ペイン
  - モーション一覧
  - `id` / `alias` / `displayName` の一覧表示
  - 検索、フィルタ、タグ表示
- 中央ペイン
  - VRM プレビュー
  - 再生中モーションの表示
  - `Play / Stop / Loop / Seek` の操作
- 右ペイン
  - 選択中モーションの詳細
  - `id`、`alias`、表示名の編集
  - ソースファイル、ループ設定、優先度、タグ編集
  - 骨回転、表情、手指の調整

画面上部には次の操作を置く。

- `Scene` / `Editor` / `Preview` の切り替え
- `Reset Pose`
- `Preset Pose`
- `Load VRM`
- `Save`
- `Load`

モーションの詳細編集画面は別画面に分離せず、VRM Editor の右ペイン内で完結させる。
`VRM Motion Detail` という名称は独立画面ではなく、この右ペインの詳細編集領域を指すものとして扱う。

VRM Editor での名前登録ルールは次のとおり。

- `id` は機械参照用で固定
- `alias` は人間向けの別名で任意
- `displayName` は一覧表示用で、`alias` が空なら `id` を簡略化したものを使う
- スクリプトからは `id` を第一候補として参照する
- `alias` は検索補助と UI 表示のために使う

VRM の読み込みは必須機能とし、少なくともファイル選択または URL 指定でモデルを読み込めるようにする。
読み込み後は、現在の VRM 名称や状態を画面内に表示して確認できるようにする。
読み込んだ VRM の骨名一覧を可視化し、選択した骨をプレビュー上で強調表示できるようにする。
骨の手動割り当ては、実ボーン再生が安定するまでの補助線として扱う。

再生確認時は、一覧から選んだモーションをそのままプレビューに反映できるようにする。
これにより、名前登録と動作確認を同じ画面内で完結できる。

### 7.9 VRM Motion Runtime の方針

VRM の再生は簡易な筒モデルの回転ではなく、実際のモーションデータを VRM の骨に流し込む方式を採用する。

- モーションは実アニメーションデータとして保持する
  - 例: VRMA、GLTF Animation、BVH 変換済みデータ
- 再生時は `AnimationClip` または同等のモーション記述へ正規化する
- VRM の humanoid bone に対して retarget する
- 肩、腕、手、脚、頭の主要ボーンを優先的に対応付ける
- `Play / Stop / Loop / Seek` は実 clip 再生に対して動作する
- 一時的なデフォルメ表示や筒モデルは、実装検証用の補助にとどめる
- `Bone Mapping` は、完全自動化ができるまでの手動補助UIとして扱う
- 骨名一覧は、ノード確認と割り当て修正のために表示する
- 実際のモーションが再生できることを、試作完了条件に含める

### 7.10 標準 VRM アセットの配置

標準 VRM は、筒モデルのような仮モデルではなく、実際に確認と再生検証に使う基準アバターとして扱う。

- 公開用の配置先は `docs/assets/vrm/standard/` を基本とする
- 編集元の管理が必要な場合は、別途 `assets/vrm/standard/` を原本置き場として使う
- VRM Editor では、標準 VRM を最初の確認対象として読み込めるようにする
- `vrm-editor-data.json` や共通マニフェストからは、公開用の標準 VRM を参照する
- 標準 VRM が未配置のときだけ、暫定のフォールバック表示を使う
- フォールバック表示は検証補助であり、通常の動作確認対象にはしない

### 7.11 UI レビュー観点

新しい UI を追加するときは、既存の部品と並び順を壊していないかを先に確認する。

- 同じ意味の入力は同じ見出し・同じ順序・同じ入力形式に揃える
- `Transform`、画像設定、モーション設定のような基本項目は個別に増やさず、共通コンポーネントを再利用する
- `2D` と `3D` の差分は、レイアウトを変えるのではなく、軸の意味と補助文言で表現する
- `PNG`、`ADVMNG`、`VRM` のように似た設定画面は、同じ部品を流用して見た目と操作感を揃える
- 画面全体のスクロールを増やす実装は避け、必要なら内部スクロールに限定する
- 新しいボタンや入力欄を追加する前に、既存のペインに収まるかを確認する
6. アクティブ中は毎フレーム `update` が呼ばれる
7. 削除または破棄時に `destroy` が 1 回だけ実行される

### 6.2 安全性のルール

- `Transform` は GameObject から削除できない
- `start` は有効化ごとに 1 回だけ実行する
- 破棄済みオブジェクトは更新されない
- 子オブジェクトは親の有効状態に追従する

## 7. 描画方針

初期コアは完全なレンダラーを必要としない。後から次のどれかを選べるように、描画境界を分離しておく。

- Canvas 2D
- WebGL
- WebGPU
- WASM 向けコマンドバッファ方式

推奨方針:

- 可視コンポーネントは軽量に保つ
- `Renderer` に描画状態を集約させる
- ゲームロジックを GPU 詳細に結び付けない

## 8. WASM と Rust 連携

WASM は所有権の主軸ではなく、高負荷処理の層として扱う。

利用候補:

- 数学処理
- 物理ステップ
- 経路探索
- アニメーション評価
- 共有プロトコルのエンコード/デコード

JavaScript / TypeScript 側のエンジンは、WASM がなくても動作できるようにする。

## 9. ネットワーク拡張点

ネットワークは MVP 対象外だが、将来の接続点は残しておく。

想定する追加要素:

- 共有プロトコル型
- クライアント/サーバー同期
- WebRTC 送受信
- サーバー権威型更新

そのため、Scene やゲームロジックは通信詳細に依存しない設計にする。

## 10. 実装順序

推奨順序は次のとおり。

1. `Vector3`
2. `Component`
3. `Transform`
4. `GameObject`
5. `Scene`
6. `SceneManager`
7. `Time`
8. `Engine`
9. `ScriptComponent`
10. 描画関連モジュール

## 11. MVP 完了条件

コア MVP は以下を満たした時点で完了とする。

- エンジンループの start / stop が動作する
- Delta Time が取得できる
- 複数シーンを登録できる
- アクティブシーンを切り替えられる
- シーンが複数 GameObject を管理できる
- Component を追加し型指定で取得できる
- すべての GameObject に Transform がある
- 親子関係が動作する
- Component のライフサイクル順序が正しい
- 破棄済みオブジェクトが更新されない
- 基本テストが通る

## 12. 次のステップ

この文書が確定したら、設計に対応する TypeScript の初期ソースを作成し、ライフサイクルとシーン管理のテストを追加する。

## 13. 共通アセット形式

### 13.1 位置づけ

別ツールで作成したアセットを、ゲームエンジン側で共通形式として読み込むための基盤を定義する。

- VRM モーション編集ツール
- PNG / スプライト編集ツール
- ADVMNG / シーン編集ツール
- Mint MCP などの外部生成ツール

### 13.2 役割分担

- Asset Tool: アセットの作成と編集
- Exporter: JSON と実体ファイルの出力
- Runtime: 正規化済みアセットの読み込みと利用
- ResourceManager: ローカルキャッシュと再利用

### 13.3 共通アセットマニフェスト

共通アセットは JSON で保持する。

- `id`: 内部参照用の一意キー
- `kind`: 用途分類
- `source`: 実体ファイル、または URL
- `alias`: 表示名や別名検索用
- `scriptName`: スクリプトから参照する名前
- `tags`: 検索補助
- `meta`: ツール固有の補助情報

### 13.4 代表的な `kind`

- `vrm`
- `vrm-motion`
- `sprite-animation`
- `image`
- `audio`
- `scene`
- `script`
- `prefab`
- `data`

### 13.5 推奨フォルダ構成

```text
assets/
  manifest/
    shared-assets.json
  motion-data/
  images/
  audio/
  scenes/
```

### 13.6 利用原則

- 別ツールはアセットの書き出しだけを担当する
- エンジン本体は同じマニフェスト形式を読む
- ツール固有のUI状態はマニフェストに含めない
- 取得失敗時はフォールバックを許可する

## 14. Mint MCP 統合レイヤー

### 14.1 位置づけ

Mint MCP はエンジンコアではなく、外部アセット供給レイヤーとして統合する。

- コアエンジンは Mint がなくても動作する
- Mint は生成アセットの取得と更新を高速化する補助レイヤーとする
- `mint-threejs-skills` は Mint MCP を扱う Three.js 側のクライアント実装ガイドとして扱う

### 14.2 役割分担

- Mint MCP: 3D アセット生成とメタデータ提供
- Integration Layer: 取得、正規化、キャッシュ、失敗時フォールバック
- Editor Layer: 生成アセットの確認、命名、保存、差し替え
- Runtime Layer: 正規化済みアセットの読み込みと描画

### 14.3 推奨フォルダ構成

```text
src/
  integration/
    mint/
      MintMcpAdapter.ts
      MintAssetProvider.ts
      MintAssetManifest.ts
      MintAssetCache.ts
      MintAssetNormalizer.ts
      MintColliderAdapter.ts
      MintStreamingAdapter.ts
  assets/
    manifest/
      mint-assets.json
      vrm-motion-manifest.json
```

### 14.4 アセットフロー

```text
AI Agent
  -> Mint MCP
  -> Asset URL / Metadata / Collider / Streaming info
  -> Mint Integration Layer
  -> Engine Resource / Scene / Editor
```

### 14.5 対応データ種別

- Gaussian Splat
- GLTF / GLB
- Collider データ
- Streaming 参照情報
- 表示名、タグ、優先度、スクリプト参照名

### 14.6 設計原則

- 生成アセットは JSON マニフェストとして保持する
- 実体の取得失敗時はローカルのフォールバックデータを使う
- エンジン本体は Mint 依存にしない
- Editor と Runtime で同じマニフェストを参照できるようにする
- 生成結果は `id` と `scriptName` を分離して管理する

### 14.7 Three.js 側との関係

`mint-threejs-skills` は Three.js 側の統合手順を提供するため、以下の役割に分けると扱いやすい。

- アセットのロード手順
- 生成物の検証
- コライダーの配置
- 表示用のメタ情報管理
- 編集画面との接続
