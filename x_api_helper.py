"""
X (Twitter) API v2 Helper
==========================
X API kullanarak kullanıcı bilgisi çekmek için yardımcı modül.

ÖNEMLİ: X API Tier Bilgileri (Eylül 2026 itibarıyla)
------------------------------------------------------
- Free Tier  : Sadece tweet gönderme/silme (kullanıcı bilgisi ÇEKİLEMEZ)
- Basic Tier : $200/ay - Kullanıcı lookup, tweet okuma (10,000 tweet/ay)
- Pro Tier   : $5,000/ay - Tam erişim

API Key almak için: https://developer.x.com/en/portal/dashboard
"""

import tweepy
import json
import sys


# ============================================================
# YÖNTEM 1: X API v2 (tweepy.Client) - ÖNERİLEN
# En az Basic tier ($200/ay) gerektirir
# ============================================================

def fetch_user_by_api_v2(username: str, bearer_token: str) -> dict | None:
    """
    X API v2 ile kullanıcı bilgisi çeker.
    
    Args:
        username: X kullanıcı adı (@ olmadan)
        bearer_token: X Developer Portal'dan alınan Bearer Token
    
    Returns:
        Kullanıcı bilgisi dict veya None
    """
    try:
        client = tweepy.Client(bearer_token=bearer_token)

        user = client.get_user(
            username=username,
            user_fields=[
                "name",
                "description",
                "location",
                "public_metrics",   # followers, following, tweet count
                "profile_image_url",
                "created_at",
                "verified",
                "url",
                "pinned_tweet_id",
            ]
        )

        if user.data is None:
            print(f"Kullanıcı bulunamadı: @{username}")
            return None

        data = user.data
        metrics = data.public_metrics or {}

        result = {
            "id": data.id,
            "username": data.username,
            "name": data.name,
            "description": data.description,
            "location": data.location,
            "url": data.url,
            "profile_image_url": data.profile_image_url,
            "created_at": str(data.created_at) if data.created_at else None,
            "verified": data.verified,
            "followers_count": metrics.get("followers_count", 0),
            "following_count": metrics.get("following_count", 0),
            "tweet_count": metrics.get("tweet_count", 0),
            "listed_count": metrics.get("listed_count", 0),
        }

        return result

    except tweepy.errors.Unauthorized:
        print("HATA: API anahtarı geçersiz veya süresi dolmuş.")
        return None
    except tweepy.errors.Forbidden:
        print("HATA: Bu endpoint'e erişim yetkiniz yok. Basic tier ($200/ay) gerekli.")
        return None
    except tweepy.errors.TooManyRequests:
        print("HATA: Rate limit aşıldı. Biraz bekleyin.")
        return None
    except tweepy.errors.NotFound:
        print(f"HATA: @{username} kullanıcısı bulunamadı.")
        return None
    except Exception as e:
        print(f"HATA: {e}")
        return None


# ============================================================
# YÖNTEM 2: X API v2 OAuth 1.0a (tweepy.Client + OAuth)
# Kendi hesabınız adına işlem yapmak için
# ============================================================

def fetch_user_by_oauth(
    username: str,
    consumer_key: str,
    consumer_secret: str,
    access_token: str,
    access_token_secret: str,
) -> dict | None:
    """
    OAuth 1.0a ile kimlik doğrulama yaparak kullanıcı bilgisi çeker.
    Kendi hesabınız adına API çağrısı yapar.
    """
    try:
        client = tweepy.Client(
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            access_token=access_token,
            access_token_secret=access_token_secret,
        )

        user = client.get_user(
            username=username,
            user_fields=[
                "name",
                "description",
                "location",
                "public_metrics",
                "profile_image_url",
                "created_at",
                "verified",
                "url",
            ]
        )

        if user.data is None:
            return None

        data = user.data
        metrics = data.public_metrics or {}

        return {
            "id": data.id,
            "username": data.username,
            "name": data.name,
            "description": data.description,
            "location": data.location,
            "url": data.url,
            "profile_image_url": data.profile_image_url,
            "created_at": str(data.created_at) if data.created_at else None,
            "verified": data.verified,
            "followers_count": metrics.get("followers_count", 0),
            "following_count": metrics.get("following_count", 0),
            "tweet_count": metrics.get("tweet_count", 0),
            "listed_count": metrics.get("listed_count", 0),
        }

    except tweepy.errors.Forbidden:
        print("HATA: Bu endpoint'e erişim yetkiniz yok. Basic tier gerekli.")
        return None
    except Exception as e:
        print(f"HATA: {e}")
        return None


# ============================================================
# YÖNTEM 3: Birden fazla kullanıcıyı toplu çekme
# ============================================================

def fetch_multiple_users(usernames: list[str], bearer_token: str) -> list[dict]:
    """
    Birden fazla kullanıcıyı tek seferde çeker (max 100).
    """
    try:
        client = tweepy.Client(bearer_token=bearer_token)

        users = client.get_users(
            usernames=usernames[:100],  # API max 100 kullanıcı
            user_fields=[
                "name",
                "description",
                "location",
                "public_metrics",
                "profile_image_url",
                "created_at",
                "url",
            ]
        )

        if users.data is None:
            return []

        results = []
        for data in users.data:
            metrics = data.public_metrics or {}
            results.append({
                "id": data.id,
                "username": data.username,
                "name": data.name,
                "description": data.description,
                "location": data.location,
                "followers_count": metrics.get("followers_count", 0),
                "following_count": metrics.get("following_count", 0),
                "tweet_count": metrics.get("tweet_count", 0),
            })

        return results

    except Exception as e:
        print(f"HATA: {e}")
        return []


# ============================================================
# YÖNTEM 4: Kullanıcının son tweetlerini çekme
# ============================================================

def fetch_user_tweets(username: str, bearer_token: str, max_results: int = 10) -> list[dict]:
    """
    Bir kullanıcının son tweetlerini çeker.
    """
    try:
        client = tweepy.Client(bearer_token=bearer_token)

        # Önce kullanıcı ID'sini al
        user = client.get_user(username=username)
        if user.data is None:
            return []

        user_id = user.data.id

        tweets = client.get_users_tweets(
            id=user_id,
            max_results=min(max_results, 100),
            tweet_fields=["created_at", "public_metrics", "text", "lang"],
        )

        if tweets.data is None:
            return []

        results = []
        for tweet in tweets.data:
            metrics = tweet.public_metrics or {}
            results.append({
                "id": tweet.id,
                "text": tweet.text,
                "created_at": str(tweet.created_at) if tweet.created_at else None,
                "lang": tweet.lang,
                "retweet_count": metrics.get("retweet_count", 0),
                "like_count": metrics.get("like_count", 0),
                "reply_count": metrics.get("reply_count", 0),
                "quote_count": metrics.get("quote_count", 0),
            })

        return results

    except Exception as e:
        print(f"HATA: {e}")
        return []


# ============================================================
# Ana çalıştırma
# ============================================================

if __name__ == "__main__":
    # -------------------------------------------------------
    # API ANAHTARLARINIZI BURAYA GİRİN
    # https://developer.x.com/en/portal/dashboard
    # -------------------------------------------------------
    BEARER_TOKEN = "BURAYA_BEARER_TOKEN_GIRIN"

    # Alternatif: OAuth 1.0a anahtarları
    CONSUMER_KEY = "..."
    CONSUMER_SECRET = "..."
    ACCESS_TOKEN = "..."
    ACCESS_TOKEN_SECRET = "..."

    # -------------------------------------------------------
    # Kullanıcı adını komut satırından veya doğrudan girin
    # -------------------------------------------------------
    if len(sys.argv) > 1:
        target_username = sys.argv[1].lstrip("@")
    else:
        target_username = "elonmusk"  # Örnek kullanıcı adı

    print(f"\n{'='*50}")
    print(f"  X API v2 - Kullanıcı Bilgi Çekme")
    print(f"  Hedef: @{target_username}")
    print(f"{'='*50}\n")

    # Bearer Token ile çek (önerilen)
    user_info = fetch_user_by_api_v2(target_username, BEARER_TOKEN)

    # Eğer Bearer Token yoksa OAuth ile dene
    if user_info is None and CONSUMER_KEY != "...":
        print("Bearer Token ile çekilemedi, OAuth deneniyor...")
        user_info = fetch_user_by_oauth(
            target_username,
            CONSUMER_KEY,
            CONSUMER_SECRET,
            ACCESS_TOKEN,
            ACCESS_TOKEN_SECRET,
        )

    if user_info:
        print("✅ Kullanıcı bilgisi başarıyla çekildi:\n")
        print(json.dumps(user_info, indent=2, ensure_ascii=False))

        # Son tweetleri de çek
        print(f"\n--- Son 5 Tweet ---\n")
        tweets = fetch_user_tweets(target_username, BEARER_TOKEN, max_results=5)
        for i, tweet in enumerate(tweets, 1):
            print(f"{i}. {tweet['text'][:100]}...")
            print(f"   ❤️ {tweet['like_count']}  🔁 {tweet['retweet_count']}  💬 {tweet['reply_count']}")
            print()
    else:
        print("❌ Kullanıcı bilgisi çekilemedi.")
        print("\nOlası sebepler:")
        print("  1. API anahtarları geçersiz veya girilmemiş")
        print("  2. Free tier kullanıyorsunuz (Basic tier $200/ay gerekli)")
        print("  3. Kullanıcı adı yanlış veya hesap silinmiş")
        print("  4. Rate limit aşılmış")
