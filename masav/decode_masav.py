#!/usr/bin/env python3
"""
MASAV File Decoder
Decodes Hebrew names from MASAV files (Code A or Code B) back to readable Hebrew
"""

import sys
from pathlib import Path

# Hebrew Code A mapping (ASCII A-Z to Hebrew)
MASAV_CODE_A = {
    38: 'א',   # & (0x26)
    65: 'ב',   # A (0x41)
    66: 'ג',   # B
    67: 'ד',   # C
    68: 'ה',   # D
    69: 'ו',   # E
    70: 'ז',   # F
    71: 'ח',   # G
    72: 'ט',   # H
    73: 'י',   # I
    74: 'ך',   # J (final kaf)
    75: 'כ',   # K
    76: 'ל',   # L
    77: 'ם',   # M (final mem)
    78: 'מ',   # N
    79: 'ן',   # O (final nun)
    80: 'נ',   # P
    81: 'ס',   # Q
    82: 'ע',   # R
    83: 'ף',   # S (final pe)
    84: 'פ',   # T
    85: 'ץ',   # U (final tsadi)
    86: 'צ',   # V
    87: 'ק',   # W
    88: 'ר',   # X
    89: 'ש',   # Y
    90: 'ת',   # Z
}

# Hebrew Code B mapping (bytes 128-154 to Hebrew)
MASAV_CODE_B = {
    128: 'א',  # 0x80
    129: 'ב',  # 0x81
    130: 'ג',  # 0x82
    131: 'ד',  # 0x83
    132: 'ה',  # 0x84
    133: 'ו',  # 0x85
    134: 'ז',  # 0x86
    135: 'ח',  # 0x87
    136: 'ט',  # 0x88
    137: 'י',  # 0x89
    138: 'ך',  # 0x8A (final kaf)
    139: 'כ',  # 0x8B
    140: 'ל',  # 0x8C
    141: 'ם',  # 0x8D (final mem)
    142: 'מ',  # 0x8E
    143: 'ן',  # 0x8F (final nun)
    144: 'נ',  # 0x90
    145: 'ס',  # 0x91
    146: 'ע',  # 0x92
    147: 'ף',  # 0x93 (final pe)
    148: 'פ',  # 0x94
    149: 'ץ',  # 0x95 (final tsadi)
    150: 'צ',  # 0x96
    151: 'ק',  # 0x97
    152: 'ר',  # 0x98
    153: 'ש',  # 0x99
    154: 'ת',  # 0x9A
}


def decode_hebrew(bytes_data, code_type='auto'):
    """Decode Hebrew text from MASAV encoding"""
    # Auto-detect which code is used
    if code_type == 'auto':
        # Check if any byte is in Code B range (128-154)
        has_code_b = any(b >= 128 and b <= 154 for b in bytes_data)
        code_type = 'code-b' if has_code_b else 'code-a'

    mapping = MASAV_CODE_B if code_type == 'code-b' else MASAV_CODE_A
    result = ''
    for b in bytes_data:
        if b in mapping:
            result += mapping[b]
        else:
            result += chr(b)  # Keep as-is (spaces, numbers, etc.)

    return result.strip()


def decode_masav_file(filepath):
    """Decode and display MASAV file contents"""
    with open(filepath, 'rb') as f:
        content = f.read()

    lines = content.split(b'\r\n')

    print("=" * 100)
    print(f"MASAV File: {filepath}")
    print("=" * 100)
    print()

    detail_count = 0
    total_amount = 0

    for i, line in enumerate(lines, 1):
        if len(line) == 0:
            continue

        if len(line) != 128:
            print(f"⚠️  Line {i}: Invalid length {len(line)} (should be 128)")
            continue

        record_type = chr(line[0])

        if record_type == 'K':
            # Header record
            institution = line[1:9].decode('ascii')
            payment_date = line[11:17].decode('ascii')
            sequence = line[18:21].decode('ascii')

            # Institution name (positions 39-69, 30 chars)
            inst_name_bytes = line[39:69]
            inst_name = decode_hebrew(inst_name_bytes)

            print(f"📋 HEADER (K)")
            print(f"   Institution ID: {institution}")
            print(f"   Institution Name: {inst_name}")
            print(f"   Payment Date: {payment_date[0:2]}/{payment_date[2:4]}/20{payment_date[4:6]}")
            print(f"   Sequence: {sequence}")
            print()

        elif record_type == '1':
            # Detail record
            detail_count += 1
            institution = line[1:9].decode('ascii')
            bank = line[17:19].decode('ascii')
            branch = line[19:22].decode('ascii')
            account = line[26:35].decode('ascii')

            # Beneficiary ID (positions 36-45, 9 chars)
            benef_id = line[36:45].decode('ascii').strip()
            # Remove leading zeros from ID
            benef_id_display = benef_id.lstrip('0') if benef_id and benef_id != '000000000' else None

            # Beneficiary name (positions 45-61, 16 chars)
            name_bytes = line[45:61]
            name = decode_hebrew(name_bytes)

            # Amount (positions 61-74, 13 chars)
            amount_str = line[61:74].decode('ascii')
            amount = int(amount_str) / 100  # Convert agorot to ILS
            total_amount += amount

            # Reference (positions 74-94, 20 chars)
            reference = line[74:94].decode('ascii').strip()

            print(f"💰 DETAIL #{detail_count}")
            print(f"   Name: {name}")
            if benef_id_display:
                print(f"   ID: {benef_id_display}")
            print(f"   Bank: {bank}, Branch: {branch}, Account: {account}")
            print(f"   Amount: ₪{amount:,.2f}")
            print(f"   Reference: {reference}")
            print()

        elif record_type == '5':
            # Trailer record
            total_in_file = int(line[21:36].decode('ascii')) / 100
            record_count = int(line[51:58].decode('ascii'))

            print(f"📊 TRAILER (5)")
            print(f"   Total Records: {record_count}")
            print(f"   Total Amount: ₪{total_in_file:,.2f}")
            print()

        elif record_type == '9':
            # End of file marker
            print(f"🏁 END OF FILE")
            print()

    print("=" * 100)
    print(f"Summary: {detail_count} transfers, Total: ₪{total_amount:,.2f}")
    print("=" * 100)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 decode_masav.py <masav_file.txt>")
        print("Example: python3 decode_masav.py MT_251124.txt")
        sys.exit(1)

    filepath = sys.argv[1]
    if not Path(filepath).exists():
        print(f"Error: File not found: {filepath}")
        sys.exit(1)

    decode_masav_file(filepath)
