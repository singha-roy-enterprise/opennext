/**
 * Converts a number to its Indian currency word representation.
 *
 * Uses the Indian numbering system (lakhs, crores) instead of millions/billions.
 *
 * @example
 * numberToWords(8640) // "Eight Thousand Six Hundred Forty"
 * numberToWords(123456) // "One Lakh Twenty Three Thousand Four Hundred Fifty Six"
 */
export function numberToWords(num: number): string {
    if (num === 0) return "Zero";
    if (num < 0) return "Minus " + numberToWords(Math.abs(num));

    // Round to 2 decimal places and separate rupees and paise
    const rounded = Math.round(num * 100) / 100;
    const rupees = Math.floor(rounded);
    const paise = Math.round((rounded - rupees) * 100);

    const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
    ];

    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convertLessThanHundred(n: number): string {
        if (n < 20) return ones[n];
        const ten = Math.floor(n / 10);
        const one = n % 10;
        return tens[ten] + (one ? " " + ones[one] : "");
    }

    function convertLessThanThousand(n: number): string {
        if (n < 100) return convertLessThanHundred(n);
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        return ones[hundred] + " Hundred" + (remainder ? " " + convertLessThanHundred(remainder) : "");
    }

    function convertToIndianWords(n: number): string {
        if (n === 0) return "";
        if (n < 1000) return convertLessThanThousand(n);

        // Indian numbering: thousand, lakh, crore
        if (n < 100000) {
            // Thousands (1,000 to 99,999)
            const thousands = Math.floor(n / 1000);
            const remainder = n % 1000;
            return (
                convertLessThanHundred(thousands) +
                " Thousand" +
                (remainder ? " " + convertLessThanThousand(remainder) : "")
            );
        }

        if (n < 10000000) {
            // Lakhs (1,00,000 to 99,99,999)
            const lakhs = Math.floor(n / 100000);
            const remainder = n % 100000;
            return convertLessThanHundred(lakhs) + " Lakh" + (remainder ? " " + convertToIndianWords(remainder) : "");
        }

        // Crores (1,00,00,000 and above)
        const crores = Math.floor(n / 10000000);
        const remainder = n % 10000000;
        return convertToIndianWords(crores) + " Crore" + (remainder ? " " + convertToIndianWords(remainder) : "");
    }

    let result = convertToIndianWords(rupees);

    if (paise > 0) {
        result += " and " + convertLessThanHundred(paise) + " Paise";
    }

    return result;
}

/**
 * Formats the amount in words for Indian currency with "INR" prefix and "Only" suffix.
 *
 * @example
 * formatAmountInWords(8640) // "INR Eight Thousand Six Hundred Forty Only"
 */
export function formatAmountInWords(amount: number): string {
    if (amount === 0) return "INR Zero Only";
    return `INR ${numberToWords(amount)} Only`;
}
