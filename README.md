## bayarea-fig

```bayarea-fig``` plots ancestral ranges for all nodes on a phylogenetic tree. The current version of the program is not particularly clever, so maps are not positioned to minimize overlap. Users can correct for this effect in two ways: 1) click on a map to make it disappear; and 2) modify the settings block to your liking.

To use ```bayarea-fig```, visit http://mlandis.github.com/bayarea-fig.

### bayarea-fig settings block
Here's an example for an analysis with 5 areas of 3 types.
```
Begin bayarea-fig;
    mapheight 100
    mapwidth 150
    markerradius 1.0
    canvasheight 2000
    canvaswidth 1000
    minareaval 0.15
    areacolors blue red green
    areatypes 1 3 2 2 1
    areanames Earth Mars Venus
End;
```

```mapheight``` and ```mapwidth``` provide the dimensions of maps drawn at each node. Minimum global map size is 700 by 350 (a result of using Cloudmade, the maptile server).

```markerradius``` allows you tune the size of markers relative to the map size (default 1.0)

```canvasheight``` and ```canvaswidth``` provide the dimensions for the figure. Larger figures mean less of the tree is hidden by maps.

```minareaval``` is the smallest per-area value shown on the map (helps with figure readability).

```areacolors``` is an ordered list of colors corresponding to area groups

```areatypes``` is an ordered list of numbers used to assign group membership to areas

```areanames``` is an ordered list of names corresponding to area groups

```showlegend``` shows the legend figure and text (default 1) or hides it (0)
