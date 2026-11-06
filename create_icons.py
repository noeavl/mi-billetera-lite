from PIL import Image, ImageDraw, ImageFont

def create_wallet_icon(size, output_path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background - green rounded rectangle
    margin = size // 8
    radius = size // 8
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(46, 125, 50, 255)  # #2E7D32
    )
    
    # Wallet body - white rounded rectangle
    wallet_margin = size // 4
    wallet_radius = size // 16
    draw.rounded_rectangle(
        [wallet_margin, wallet_margin * 1.5, size - wallet_margin, size - wallet_margin * 1.2],
        radius=wallet_radius,
        fill=(255, 255, 255, 255)
    )
    
    # Wallet fold line
    center_x = size // 2
    fold_top = int(wallet_margin * 1.5)
    fold_bottom = int(size - wallet_margin * 1.2)
    draw.line(
        [(center_x, fold_top), (center_x, fold_bottom)],
        fill=(224, 224, 224, 255),
        width=max(2, size // 128)
    )
    
    # Wallet slot lines
    slot_y1 = int(size * 0.35)
    slot_y2 = int(size * 0.55)
    slot_left = int(wallet_margin * 1.5)
    slot_right = int(size - wallet_margin * 1.5)
    line_width = max(2, size // 170)
    draw.line(
        [(slot_left, slot_y1), (slot_right, slot_y1)],
        fill=(224, 224, 224, 255),
        width=line_width
    )
    draw.line(
        [(slot_left, slot_y2), (slot_right, slot_y2)],
        fill=(224, 224, 224, 255),
        width=line_width
    )
    
    # Currency symbol
    try:
        font_size = size // 6
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "$"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2
    text_y = int(size * 0.38) - text_height // 2
    
    draw.text(
        (text_x, text_y),
        text,
        font=font,
        fill=(46, 125, 50, 255)  # #2E7D32
    )
    
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")

create_wallet_icon(192, '/Users/noeabelvargaslopez/Documents/mi-billetera-lite/icons/icon-192.png')
create_wallet_icon(512, '/Users/noeabelvargaslopez/Documents/mi-billetera-lite/icons/icon-512.png')