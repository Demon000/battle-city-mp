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
            if color == (0, 0, 0, 0):
                continue

            unique_colors.add(color)

    return unique_colors

def color_average(color):
    return sum(list(color)[:3])//3

def color_difference(brighter, darker):
    return (brighter[0] - darker[0], brighter[1] - darker[1], brighter[2] - darker[2])

unique_colors = list(get_unique_colors(image))
unique_colors.sort(key=color_average)
print("unique colors: ", unique_colors)

def filter_image(image, target_color, replacement_color):
    for i in range(image.size[0]):
        for j in range(image.size[1]):
            color = image.getpixel((i, j))
            if color == target_color:
                image.putpixel((i, j), replacement_color)
            else:
                image.putpixel((i, j), (0, 0, 0, 0))

    return image

def append_before_file_name(filename, data):
    name, ext = os.path.splitext(filename)
    return name + data + ext

unique_colors_len = len(unique_colors)
if unique_colors_len == 2:
    lightest_color = unique_colors[1]
    lightest_base_color = unique_colors[0]
    darkest_color = unique_colors[0]
    darkest_base_color = unique_colors[1]
elif unique_colors_len == 3:
    lightest_color = unique_colors[2]
    lightest_base_color = unique_colors[1]
    darkest_color = unique_colors[0]
    darkest_base_color = unique_colors[1]

lightest_color_difference = color_difference(lightest_color, lightest_base_color)
darkest_color_difference = color_difference(darkest_base_color, darkest_color)

print("lightest_color:", lightest_color)
print("lightest_base_color:", lightest_base_color)
print("lightest_color_difference:", lightest_color_difference)
print("darkest_color:", darkest_color)
print("darkest_base_color:", darkest_base_color)
print("darkest_color_difference:", darkest_color_difference)

highlights_image = filter_image(image.copy(), lightest_color, lightest_color_difference)
highlights_image_name = append_before_file_name(sys.argv[1], '_highlights')
highlights_image.save(highlights_image_name)

shadows_image = filter_image(image.copy(), darkest_color, darkest_color_difference)
shadows_image_name = append_before_file_name(sys.argv[1], '_shadows')
shadows_image.save(shadows_image_name)
