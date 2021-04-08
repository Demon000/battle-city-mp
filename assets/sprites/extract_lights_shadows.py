#!/usr/bin/env python 

from PIL import Image
import sys
import os

if len(sys.argv) < 2:
    print("usage: {} <image>".format(sys.argv[0]))

image = Image.open(sys.argv[1], 'r')
image = image.convert('RGBA')

def get_unique_colors(image):
    unique_colors = set()

    for i in range(image.size[0]):
        for j in range(image.size[1]):
            color = image.getpixel((i, j))
            unique_colors.add(color)

    return unique_colors

unique_colors = get_unique_colors(image)

def color_average(color):
    return sum(list(color)[:3])

def greyscale_color(color):
    average = color_average(color)
    return (average, average, average, color[3])

lightest_color = None
darkest_color = None
for color in unique_colors:
    if color_average(color) == 0:
        continue

    if lightest_color == None \
            or color_average(lightest_color) < color_average(color):
        lightest_color = color

    if darkest_color == None \
            or color_average(darkest_color) > color_average(color):
        darkest_color = color

def filter_image(image, keep_color):
    for i in range(image.size[0]):
        for j in range(image.size[1]):
            color = image.getpixel((i, j))
            if color == keep_color:
                image.putpixel((i, j), greyscale_color(color))
            else:
                image.putpixel((i, j), (0, 0, 0, 0))

    return image

def append_before_file_name(filename, data):
    name, ext = os.path.splitext(filename)
    return name + data + ext

highlights_image = filter_image(image.copy(), lightest_color)
shadows_image = filter_image(image.copy(), darkest_color)
highlights_image_name = append_before_file_name(sys.argv[1], '_highlights')
shadows_image_name = append_before_file_name(sys.argv[1], '_shadows')

highlights_image.save(highlights_image_name)
shadows_image.save(shadows_image_name)
