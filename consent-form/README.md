# MIGAQ 美容室電子同意書システム

施術後の返金トラブル防止のための電子同意書 Web アプリです。

## 機能

| 機能 | 説明 |
|---|---|
| スマホ対応 | モバイルファースト・タッチ操作最適化 |
| 施術履歴確認 | 黒染め・ブリーチ・縮毛矯正・その他 |
| 参考画像添付 | カメラロール・ファイルから選択 |
| リスク自動生成 | 履歴×施術内容から自動でリスク算出 |
| チェックボックス | 5項目の同意確認（必須3・任意2） |
| 電子署名 | キャンバス手書き署名 |
| PDF出力 | 署名入り同意書PDFを即時生成 |
| Supabase保存 | DB + Storageに永久保存 |
| Google Drive保存 | 指定フォルダに自動アップロード |

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd consent-form
npm install
```

### 2. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して以下を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Drive（任意）
GOOGLE_DRIVE_FOLDER_ID=1ABC...
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@yyy.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Supabase の設定

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. SQL Editor で `supabase/schema.sql` を実行
3. Storage > Buckets で以下を作成（全て非公開）:
   - `consent-images`
   - `consent-signatures`
   - `consent-pdfs`
4. 各バケットに INSERT / SELECT ポリシーを追加

### 4. Google Drive の設定（任意）

1. Google Cloud Console でサービスアカウント作成
2. Drive API を有効化
3. サービスアカウントに Drive フォルダの編集権限を付与
4. JSON キーを `.env.local` に設定

### 5. 起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

## デプロイ（Vercel 推奨）

```bash
npm run build
# Vercel にデプロイ後、環境変数を Dashboard から設定
```

## フォームの流れ（目標3分以内）

```
Step 1: お客様情報 (30秒)
  └─ 名前 / 電話 / 施術日 / 担当スタイリスト

Step 2: 施術内容 (30秒)
  └─ メニュー選択 / 参考画像

Step 3: 施術履歴 (60秒)
  └─ 黒染め / ブリーチ / 縮毛矯正 / その他

Step 4: リスク確認 (30秒)
  └─ 自動生成リスク説明 / 同意チェックボックス

Step 5: 電子署名 (30秒)
  └─ 手書き署名 → PDF生成 → 保存完了
```
