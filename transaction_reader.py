import sys
import json
import pytesseract
from PIL import Image
import re

# Set the path to the Tesseract executable
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_details(text):
    details = {}
    name_match = re.search(r'Paid to\s+([A-Za-z\s]+)', text)
    if name_match:
        details['Name'] = name_match.group(1).strip().split('\n')[0].strip()

    transaction_id_match = re.search(r'(?:Transaction ID|UPI transaction ID)[:\s]+([A-Za-z0-9]+)', text)
    if transaction_id_match:
        details['Transaction ID'] = transaction_id_match.group(1).strip()

    amount_match = re.search(r'(?:₹|Rs\.?|R)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', text)
    if amount_match:
        details['Amount'] = f"₹{amount_match.group(1).strip()}"
    else:
        details['Amount'] = None



    date_match = re.search(r'(\d{1,2} \w+ \d{4})', text)
    if date_match:
        details['Date'] = date_match.group(1).strip()

    time_match = re.search(r'(\d{1,2}:\d{2} (?:am|pm))', text)
    if time_match:
        details['Time'] = time_match.group(1).strip()

    upi_id_match = re.search(r'UPI ID[:\s]+([A-Za-z0-9@.-]+)', text)
    details['UPI ID'] = upi_id_match.group(1).strip() if upi_id_match else None

    if 'Date' in details and 'Time' in details:
        details['Date & Time'] = f"{details['Date']} {details['Time']}"

    return details

if __name__ == "__main__":
    # The image path is passed as the first command-line argument
    image_path = sys.argv[1]
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    details = extract_details(text)
    print(json.dumps(details))
