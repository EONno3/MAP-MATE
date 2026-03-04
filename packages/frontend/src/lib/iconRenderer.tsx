import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    Box, User, Star, Package, ToggleLeft, Ghost, Save, ArrowRightCircle,
    Home, Castle, Skull, ShoppingCart, Map as MapIcon, MapPin
} from 'lucide-react'
import { ObjectType, RoomType } from '../types/map'

// Cache for loaded images
const imageCache: Record<string, HTMLImageElement> = {}

export function getObjectIconComponent(type: ObjectType) {
    switch (type) {
        case 'spawn_point': return Box
        case 'enemy_spawn': return Ghost
        case 'item': return Star
        case 'chest': return Package
        case 'switch': return ToggleLeft
        case 'npc': return User
        case 'save_point': return Save
        case 'transition': return ArrowRightCircle
        default: return Box
    }
}

export function getRoomTypeIconComponent(type: RoomType) {
    switch (type) {
        case 'start': return Home
        case 'hub': return Castle
        case 'boss': return Skull
        case 'item': return Package
        case 'save': return Save
        case 'shop': return ShoppingCart
        case 'stag': return MapPin
        case 'map': return MapIcon
        default: return Box
    }
}

// Generates an HTMLImageElement from a Lucide icon
export function drawSvgIcon(
    ctx: CanvasRenderingContext2D,
    type: ObjectType | RoomType,
    x: number,
    y: number,
    size: number,
    color: string,
    onLoad?: () => void
) {
    const cacheKey = `${type}_${color}_${size}`

    if (imageCache[cacheKey]) {
        const img = imageCache[cacheKey]
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x - size / 2, y - size / 2, size, size)
        }
        return
    }

    // Determine which icon component to use
    // We check if it's an object type or room type
    const isObject = ['spawn_point', 'enemy_spawn', 'item', 'chest', 'switch', 'npc', 'save_point', 'transition'].includes(type as string)

    const IconComponent = isObject
        ? getObjectIconComponent(type as ObjectType)
        : getRoomTypeIconComponent(type as RoomType)

    // Render to SVG string
    const svgString = renderToStaticMarkup(<IconComponent color={color} size={size} />)

    // Convert to data URL
    const encoded = encodeURIComponent(svgString)
        .replace(/'/g, '%27')
        .replace(/"/g, '%22')
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`

    const img = new Image()
    img.src = dataUrl
    img.onload = () => {
        imageCache[cacheKey] = img
        if (onLoad) onLoad()
    }

    // Store it in cache so we don't recreate it
    imageCache[cacheKey] = img
}
