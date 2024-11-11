/**
 * routeHelper.tsx
 * Copyright (c) Microsoft. All rights reserved.
 */

export const mergeRoute = (baseRoute: string, appendRoute: string) => {
  const mergedParts = baseRoute?.split('/').concat(appendRoute?.split('/'));
  const filtered = mergedParts.filter(x => x && x !== '.');
  return filtered?.join('/') + (appendRoute?.endsWith('/') ? '/' : '');
}

export const getRouteDiff = (baseRoute: string, compareToRoute: string): string => {
  const baseRouteParts = baseRoute.split('/').filter(x => x && x !== '.');
  let compRouteParts = compareToRoute.split('/').filter(x => x && x !== '.');

  const diffRoute: string[] = [];

  for (let i = 0; i < baseRouteParts.length; i++) {
    if (compRouteParts.length === 0) {
      diffRoute.push('..');
      continue;
    }

    if (baseRouteParts[i] === compRouteParts[0]) {
      compRouteParts = compRouteParts.slice(1);
    }
  }

  if (compRouteParts.length > 0) {
    for (let i = 0; i < compRouteParts.length; i++) {
      diffRoute.push(compRouteParts[i]);
    }
  }

  return diffRoute.join('/');
}

export const getRelativeRoute = (baseRoute: string, relativeRoute: string) => {
  const baseParts = baseRoute.split('/').filter(x => x);
  // Remove the last part of the base if it's not a directory
  if (!baseRoute.endsWith('/')) {
    baseParts.pop();
  }

  const relativeParts = relativeRoute.split('/');

  relativeParts.forEach(function (part) {
    if (part === '..') {
      baseParts.pop();
    } else {
      baseParts.push(part);
    }
  });

  return baseParts.filter(x => x && x !== '.').join('/');
}

// split an url route by / and encode each part and exclude %2D from being encoded
export const encodeRoute = (route: string) => {
  const parts = route.split('/');
  const encodedParts = parts.map(part => {
    return customEncodeURIComponent(part);
  });

  return encodedParts.join('/');
}

export const decodeRoute = (route: string) => {
  const parts = route.split('/');
  const decodedParts = parts.map(part => {
    return customDecodeURIComponent(part);
  });

  return decodedParts.join('/');
}

// so the route needs to be encoded, including all special characters,
// however ado wiki stores file names with - encoded as %2D, which react-router
// will decode to - and then not match the route, so we need to double encode
// and not encode - to %2D since it becomes a space... TLDR; it's a freaking nightmare
export const customEncodeURIComponent = (uri: string) => {
  return uri?.replace(/[&%<>?:;=#"'\(\)*+,`{}\[\]\|^~!@\s]/g, function (c) {
    return '_x' + c.charCodeAt(0).toString(16);
  });
}

export const customDecodeURIComponent = (uri: string) => {
  return uri?.replace(/_x(0x)?[0-9a-fA-F]{2}/gm, function (c) {
    return String.fromCharCode(parseInt(c.replace('_x', ''), 16));
  });
}

export const isFileRoute = (route: string): boolean => {
  const lastRoute = route?.split('/').pop();

  // if lastRoute is empty, then the url ended with / and assumed to be folder
  if (lastRoute) {
    return /\./.test(lastRoute);
  }

  return false;
}

export const getRouteExtension = (route: string): string => {
  if (!route) {
    return null;
  }

  const lastRoute = route.split('/').pop();

  // if lastRoute is empty, then the url ended with / and assumed to be folder
  if (lastRoute) {
    if (/\./.test(lastRoute)) {
      const routeParts = lastRoute?.split('.');
      return routeParts?.pop();
    }
  }

  return null;
}

export const isExternalLink = (url: string) => {
  return /(http|https|onenote|mailto):\/\/(.*)/.test(url);
}

export const isRouteToMd = (route: string): boolean => {
  if (isFileRoute(route)) {
    const routeExt = getRouteExtension(route);
    if ((!routeExt || /md/i.test(routeExt)) && !isExternalLink(route)) {
      return true;
    }
  }
  return false;
}

export const removeRouteExtension = (route: string): string => {
  if (isFileRoute(route)) {
    const routeParts = route.split('/');
    const file = routeParts[routeParts.length - 1]
    routeParts[routeParts.length - 1] = file.split('.').length === 1 ?
      file :
      file.split('.').slice(0, -1).join('.');
    return routeParts.join('/');
  }

  return route;
}