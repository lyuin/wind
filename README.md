# Wind

ドライブ中にダッシュボード上のスマートフォンで風速・風向をリアルタイム表示するWebアプリ。

## 機能

- 現在地の風速（m/s）・風向（16方位）を表示
- 10秒間隔で自動更新
- 画面スリープ防止（Wake Lock API + 動画フォールバック）
- オフライン起動対応（PWA）
- ダークテーマ、運転中の視認性を重視したシンプルUI

## データソース

[Open-Meteo API](https://open-meteo.com/)（無料・APIキー不要）

## 使い方

1. https://lyuin.github.io/wind/ にアクセス
2. 位置情報の許可を求められたら「許可」
3. スマホのホーム画面に追加するとアプリとして使える

## 技術構成

- HTML / CSS / JavaScript（フレームワークなし）
- GitHub Pages でホスティング
- Service Worker によるオフラインキャッシュ
