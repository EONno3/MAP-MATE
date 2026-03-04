export function getContrastColor(hexColor: string): string {
    if (!hexColor) return '#ffffff'

    let hex = hexColor.replace('#', '')

    // Handle short hex
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }

    // Handle invalid hex
    if (hex.length !== 6) return '#ffffff'

    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Relative luminance calculation
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    return luminance > 0.5 ? '#000000' : '#ffffff'
}
