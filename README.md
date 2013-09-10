### bayarea-fig settings block
```
Begin bayarea-fig;
    mapheight 100
    mapwidth 150
    canvasheight 2000
    canvaswidth 1000
    minareaval 0.15
    areacolors blue red green
    areatypes 1 3 2 2 1
    areanames Earth Mars Venus
End;

```

```mapheight``` and ```mapwidth``` provide the dimensions of maps drawn at each node. Minimum global map size is 700 by 350 (per Cloudmade).

```canvasheight``` and ```canvaswidth``` provide the dimensions for the figure. Larger figures mean less of the tree is hidden by maps.

```minareaval``` is the smallest per-area value shown on the map (helps with figure readability).

```areacolors``` is an ordered list of colors corresponding to area groups

```areatypes``` is an ordered list of numbers used to assign group membership to areas

```areanames``` is an ordered list of names corresponding to area groups
