'use strict';

const words = [
  // Animals
  'cat', 'dog', 'elephant', 'giraffe', 'penguin', 'dolphin', 'shark', 'eagle',
  'butterfly', 'frog', 'turtle', 'rabbit', 'horse', 'cow', 'pig', 'chicken',
  'parrot', 'crocodile', 'kangaroo', 'panda', 'zebra', 'lion', 'tiger', 'bear',
  'wolf', 'fox', 'deer', 'monkey', 'gorilla', 'cheetah', 'whale', 'octopus',
  'jellyfish', 'crab', 'lobster', 'snail', 'bee', 'ant', 'duck', 'flamingo',

  // Food
  'pizza', 'burger', 'sushi', 'tacos', 'pasta', 'sandwich', 'hot dog', 'ice cream',
  'donut', 'cake', 'cookie', 'bread', 'apple', 'banana', 'orange', 'strawberry',
  'watermelon', 'grapes', 'pineapple', 'mango', 'carrot', 'broccoli', 'mushroom',
  'potato', 'corn', 'egg', 'cheese', 'bacon', 'steak', 'fish', 'lobster', 'soup',
  'salad', 'popcorn', 'chocolate', 'candy', 'lemon', 'cherry', 'avocado', 'peanut',

  // Sports
  'football', 'basketball', 'tennis', 'golf', 'baseball', 'volleyball', 'swimming',
  'boxing', 'cycling', 'skiing', 'surfing', 'skateboarding', 'archery', 'bowling',
  'soccer', 'rugby', 'cricket', 'badminton', 'ping pong', 'weightlifting',

  // Nature
  'mountain', 'volcano', 'ocean', 'waterfall', 'forest', 'desert', 'rainbow',
  'lightning', 'tornado', 'cloud', 'snowflake', 'leaf', 'flower', 'tree', 'river',
  'island', 'cave', 'cliff', 'beach', 'sun', 'moon', 'star', 'comet', 'glacier',

  // Household items
  'chair', 'table', 'lamp', 'mirror', 'sofa', 'bed', 'pillow', 'blanket', 'clock',
  'television', 'refrigerator', 'microwave', 'toaster', 'blender', 'iron', 'vacuum',
  'broom', 'bucket', 'candle', 'vase', 'frame', 'curtain', 'carpet', 'stairs',
  'door', 'window', 'drawer', 'shelf', 'toilet', 'bathtub', 'shower', 'sink',

  // Vehicles
  'car', 'truck', 'motorcycle', 'bicycle', 'bus', 'train', 'airplane', 'helicopter',
  'boat', 'sailboat', 'submarine', 'rocket', 'hot air balloon', 'tractor', 'ambulance',
  'fire truck', 'police car', 'scooter', 'tank', 'spaceship',

  // Professions
  'doctor', 'teacher', 'chef', 'firefighter', 'police officer', 'astronaut', 'pilot',
  'farmer', 'nurse', 'dentist', 'artist', 'musician', 'scientist', 'engineer',
  'photographer', 'librarian', 'judge', 'soldier', 'carpenter', 'plumber',

  // Clothing
  'hat', 'shirt', 'pants', 'dress', 'shoes', 'boots', 'gloves', 'scarf', 'jacket',
  'coat', 'socks', 'underwear', 'swimsuit', 'tie', 'belt', 'glasses', 'umbrella',
  'backpack', 'purse', 'crown',

  // Body parts
  'hand', 'foot', 'eye', 'nose', 'mouth', 'ear', 'head', 'arm', 'leg', 'finger',
  'tooth', 'tongue', 'hair', 'eyebrow', 'shoulder', 'knee', 'elbow', 'thumb',

  // Buildings
  'house', 'castle', 'skyscraper', 'church', 'hospital', 'school', 'library',
  'museum', 'stadium', 'lighthouse', 'bridge', 'pyramid', 'windmill', 'barn',
  'igloo', 'tent', 'temple', 'prison', 'hotel', 'theater',

  // Technology
  'telephone', 'computer', 'laptop', 'tablet', 'camera', 'headphones', 'keyboard',
  'mouse', 'printer', 'robot', 'drone', 'battery', 'satellite', 'antenna', 'radio',
  'calculator', 'game controller', 'smartwatch', 'microphone', 'speaker',

  // Music instruments
  'guitar', 'piano', 'violin', 'drums', 'trumpet', 'flute', 'saxophone', 'harp',
  'cello', 'trombone', 'accordion', 'banjo', 'ukulele', 'bass guitar', 'xylophone',
];

module.exports = { words };
