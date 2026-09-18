import urllib.request
import json
import sys

# Kullanıcı tarafından sağlanan Bearer Token
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAFJZ%2FgEAAAAA4IXmlKuGOcHOMJry5l75I2h9tA4%3DEpfnIuxYbpYaKw3WwfAIzHr1nNXyPIdML5epzdp5RpiKN6Xr4H"

def get_x_user_info(username: str):
    username = username.lstrip("@")
    fields = "user.fields=description,public_metrics,location,profile_image_url,created_at,verified"
    url = f"https://api.twitter.com/2/users/by/username/{username}?{fields}"
    
    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}"
    }
    
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data
    except urllib.error.HTTPError as e:
        print(f"\n[!] HTTP Hata Kodu: {e.code}")
        if e.code == 402:
            print("-> Sebep: Payment Required (Odeme Gereklidir).")
            print("-> Aciklama: X API hesabiniz Free (Ucretsiz) katmanda. Kullanici bilgisi cekmek icin Developer Portal uzerinden en az Basic Tier ($200/ay) paketi tanimlamaniz gerekmektedir.")
        elif e.code == 401:
            print("-> Sebep: Unauthorized (Yetkisiz). API anahtari gecersiz.")
        elif e.code == 429:
            print("-> Sebep: Too Many Requests (Cok Fazla Istek). Rate limit doldu.")
        else:
            print(f"-> Detay: {e.reason}")
        return None
    except Exception as e:
        print(f"\n[!] Hata: {e}")
        return None

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "X"
    print(f"Fetching X API info for: @{target}...")
    res = get_x_user_info(target)
    if res:
        print("\n[+] Kullanici Verisi Alindi:")
        print(json.dumps(res, indent=2, ensure_ascii=False))

