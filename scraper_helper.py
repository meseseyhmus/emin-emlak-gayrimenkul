import sys
import json
import time
import undetected_chromedriver as uc

def fetch_html(url):
    options = uc.ChromeOptions()
    options.add_argument('--headless=new')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    driver = None
    try:
        # Pass main version to match installed Chrome browser (149 or 131)
        driver = uc.Chrome(options=options, version_main=149)
        driver.get(url)
        time.sleep(4) # Wait for page load and Cloudflare clearance
        
        page_source = driver.page_source
        return page_source
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        return None
    finally:
        if driver:
            try:
                driver.quit()
            except:
                pass

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
        html_content = fetch_html(target_url)
        if html_content:
            print(json.dumps({"success": True, "html": html_content}))
        else:
            print(json.dumps({"success": False, "error": "Sayfa yüklenemedi"}))
    else:
        print(json.dumps({"success": False, "error": "URL verilmedi"}))
