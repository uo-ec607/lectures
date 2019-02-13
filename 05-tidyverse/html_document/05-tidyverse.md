---
title: 'Data work in the "tidyverse"'
author:
  name: Grant R. McDermott
  affiliation: University of Oregon | EC 607
  # email: grantmcd@uoregon.edu
date: Lecture 5 #"12 February 2019"
output: 
  html_document:
    theme: flatly
    highlight: haddock 
    # code_folding: show
    toc: yes
    toc_depth: 4
    toc_float: yes
    keep_md: true
---



## Requirements

### R packages 

- **New:** `nycflights13`
- **Already used:** `tidyverse`


```r
install.packages("nycflights13")
```

## Tidyverse basics

### Student presentation: Tidy data

If you're reading this after the fact, I recommend going through the original paper: "[Tidy Data](https://vita.had.co.nz/papers/tidy-data.pdf)" (Hadley Wickham, 2014 *JSS*). I also recommend this [vignette](https://cran.r-project.org/web/packages/tidyr/vignettes/tidy-data.html) from the `tidyr` package, although we'll cover much of the same ground today. The summary version is that tidy data are characterised by three features:

1. Each variable forms a column.
2. Each observation forms a row.
3. Each type of observational unit forms a table.

We've revisit these features later in the lecture, but it should immediately be apparent to you that tidy data is more likely to be [long (i.e. narrow) format](https://en.wikipedia.org/wiki/Wide_and_narrow_data) than wide format. We'll also see that there are some tradeoffs for data that is optimised for human reading vs data that is optimised for machine reading. 

### Tidyverse vs. base R

Much digital ink has been spilled over the "tidyverse vs. base R" debate. I won't delve into this debate here, because I think the answer is [obvious](http://varianceexplained.org/r/teach-tidyverse/): We should teach (and learn) the tidyverse first.

- The documentation and community support are outstanding.
- Having a consistent philosophy and syntax makes it much easier to learn.
- For data cleaning, wrangling and plotting... the tidyverse is really a no-brainer.^[I should say that I'm also a fan of the [data.table](https://github.com/Rdatatable/data.table/wiki) package for data work. I may come back to this package once we reach the big data section of the course.]

But this certainly shouldn't put you off learning base R alternatives.

- Base R is extremely flexible and powerful (esp. when combined with other libraries).
- There are some things that you'll have to venture outside of the tidyverse for.
- A combination of tidyverse and base R is often the best solution to a problem.

One point of convenience is that there is often a direct correspondence between a tidyverse command and its base R equivalent. These invariably follow a `tidyverse::snake_case` vs `base::period.case` rule. E.g. see:
- `?readr::read_csv` vs `?utils::read.csv`
- `?tibble::data_frame`vs `?base::data.frame`
- `?dplyr::if_else` vs `?base::ifelse`
- etc.
  
If you call up the above examples, you'll see that the tidyverse alternative typically offers some enhancements or other useful options (and sometimes restrictions) over its base counterpart. Remember: There are always many ways to achieve a single goal in R.

### Tidyverse packages

Let's load the tidyverse meta-package and check the output.

```r
library(tidyverse)
```

```
## ── Attaching packages ───────────────────────────────────────────────────────────────────── tidyverse 1.2.1 ──
```

```
## ✔ ggplot2 3.1.0     ✔ purrr   0.2.5
## ✔ tibble  2.0.1     ✔ dplyr   0.7.8
## ✔ tidyr   0.8.2     ✔ stringr 1.3.1
## ✔ readr   1.3.1     ✔ forcats 0.3.0
```

```
## ── Conflicts ──────────────────────────────────────────────────────────────────────── tidyverse_conflicts() ──
## ✖ dplyr::filter() masks stats::filter()
## ✖ dplyr::lag()    masks stats::lag()
```

We see that we have actually loaded a number of packages (which could also be loaded individually): `ggplot2`, `tibble`, `dplyr`, etc. We can also see information about the package versions and some namespace conflicts --- remember those from last week?

The tidyverse actually comes with a lot more packages than those that are just loaded automatically.^[It also includes a lot of dependencies upon installation.] You can see the full list by typing:

```r
tidyverse_packages()
```

```
##  [1] "broom"       "cli"         "crayon"      "dplyr"       "dbplyr"     
##  [6] "forcats"     "ggplot2"     "haven"       "hms"         "httr"       
## [11] "jsonlite"    "lubridate"   "magrittr"    "modelr"      "purrr"      
## [16] "readr"       "readxl\n(>=" "reprex"      "rlang"       "rstudioapi" 
## [21] "rvest"       "stringr"     "tibble"      "tidyr"       "xml2"       
## [26] "tidyverse"
```

We'll use several of these additional packages during the remainder of this course. For example, the `lubridate` package for working with dates and the `rvest` package for webscraping. However, I want you to bear in mind that these packages will have to be loaded separately.

### Today's focus: `dplyr` and `tidyr`

I hope to cover most of the tidyverse packages over the length of this course. Today, however, I'm only really going to focus on two packages: 

1. `dplyr`
2. `tidyr`

These are the workhorse packages for cleaning and wrangling data. They are thus the ones that you will likely make the most use of (alongside `ggplot2`, which we already met back in Lecture 1). Data cleaning and wrangling occupies an inordinate amount of time, no matter where you are in your research career.

### An aside on the pipe: `%>%`

We already learned about pipes in our lecture on the bash shell.^[Where they were denoted `|`.] In R, the pipe operator is denoted `%>%` and is automatically loaded with the tidyverse. I want to reiterate how cool pipes are, and how using them can dramatically improve the experience of reading and writing code. To do so, let's compare two lines of code that do identical things: Get the mean fuel efficiency of a particular set of vehicles.

This first line of code reads from left to right, exactly how I thought of the operations in my head: Take this object (the [mpg](https://ggplot2.tidyverse.org/reference/mpg.html) dataset), then do this (filter down to Audi vehicles), then do this (group by model type), and finally do this (get the mean highway miles per gallon for each group class).


```r
## Piped version
mpg %>% filter(manufacturer=="audi") %>% group_by(model) %>% summarise(hwy_mean = mean(hwy))
```

```
## # A tibble: 3 x 2
##   model      hwy_mean
##   <chr>         <dbl>
## 1 a4             28.3
## 2 a4 quattro     25.8
## 3 a6 quattro     24
```

Now contrast it with this second line of code, which totally inverts the logical order of my thought process. (The final operation comes first!) Who wants to read things inside out?


```r
## Non-piped
summarise(group_by(filter(mpg, manufacturer=="audi"), model), hwy_mean = mean(hwy))
```

```
## # A tibble: 3 x 2
##   model      hwy_mean
##   <chr>         <dbl>
## 1 a4             28.3
## 2 a4 quattro     25.8
## 3 a6 quattro     24
```

The piped version of the code is even more readable if we write it over several lines. (Remember: Using vertical space costs nothing and makes for much more readable/writeable code than cramming things horizontally.) Here it is again, although I won't evaluate the code this time.


```r
mpg %>% 
  filter(manufacturer=="audi") %>% 
  group_by(model) %>% 
  summarise(hwy_mean = mean(hwy))
```

PS — The pipe is originally from the [magrittr](https://magrittr.tidyverse.org/) package ([geddit?](https://en.wikipedia.org/wiki/The_Treachery_of_Images)), which can do some other cool things if you're inclined to explore.

## Data wrangling with `dplyr`

There are five key `dplyr` verbs that you need to learn.

1. `filter()`: Filter (i.e. subset) rows based on their values.

2. `arrange()`: Arrange (i.e. reorder) rows based on their values.

3. `select()`: Select (i.e. subset) columns by their names: 

4. `mutate()`: Create new columns.

5. `summarise()`: Collapse multiple rows into a single summary value.^[`summarize()` with a "z" works too. R doesn't discriminate against uncivilised nations of the world.]

Let's practice these commands together using the starwars data frame that comes pre-packaged with `dplyr`.

### 1) `dplyr::filter()`

We use `filter()` to subset data based on rows values. For example, let's say we only want to look at tall humans in the Star Wars catalogue:


```r
starwars %>% 
  filter(species == "Human") %>%
  filter(height >= 190) 
```

```
## # A tibble: 4 x 13
##   name  height  mass hair_color skin_color eye_color birth_year gender
##   <chr>  <int> <dbl> <chr>      <chr>      <chr>          <dbl> <chr> 
## 1 Dart…    202   136 none       white      yellow          41.9 male  
## 2 Qui-…    193    89 brown      fair       blue            92   male  
## 3 Dooku    193    80 white      fair       brown          102   male  
## 4 Bail…    191    NA black      tan        brown           67   male  
## # … with 5 more variables: homeworld <chr>, species <chr>, films <list>,
## #   vehicles <list>, starships <list>
```

Note that we can chain multiple filter commands with the pipe (`%>%`), or simply separate them within a single filter command using commas.


```r
starwars %>% 
  filter( 
    species == "Human", 
    height >= 190
    ) 
```

```
## # A tibble: 4 x 13
##   name  height  mass hair_color skin_color eye_color birth_year gender
##   <chr>  <int> <dbl> <chr>      <chr>      <chr>          <dbl> <chr> 
## 1 Dart…    202   136 none       white      yellow          41.9 male  
## 2 Qui-…    193    89 brown      fair       blue            92   male  
## 3 Dooku    193    80 white      fair       brown          102   male  
## 4 Bail…    191    NA black      tan        brown           67   male  
## # … with 5 more variables: homeworld <chr>, species <chr>, films <list>,
## #   vehicles <list>, starships <list>
```

Regular expressions work well too.

```r
starwars %>% 
  filter(grepl("Skywalker", name))
```

```
## # A tibble: 3 x 13
##   name  height  mass hair_color skin_color eye_color birth_year gender
##   <chr>  <int> <dbl> <chr>      <chr>      <chr>          <dbl> <chr> 
## 1 Luke…    172    77 blond      fair       blue            19   male  
## 2 Anak…    188    84 blond      fair       blue            41.9 male  
## 3 Shmi…    163    NA black      fair       brown           72   female
## # … with 5 more variables: homeworld <chr>, species <chr>, films <list>,
## #   vehicles <list>, starships <list>
```

A very common `filter()` use case is identifying (or removing) missing data cases. 

```r
starwars %>% 
  filter(is.na(height))
```

```
## # A tibble: 6 x 13
##   name  height  mass hair_color skin_color eye_color birth_year gender
##   <chr>  <int> <dbl> <chr>      <chr>      <chr>          <dbl> <chr> 
## 1 Arve…     NA    NA brown      fair       brown             NA male  
## 2 Finn      NA    NA black      dark       dark              NA male  
## 3 Rey       NA    NA brown      light      hazel             NA female
## 4 Poe …     NA    NA brown      light      brown             NA male  
## 5 BB8       NA    NA none       none       black             NA none  
## 6 Capt…     NA    NA unknown    unknown    unknown           NA female
## # … with 5 more variables: homeworld <chr>, species <chr>, films <list>,
## #   vehicles <list>, starships <list>
```

To remove missing observations, simply use negation: `filter(!is.na(height))`. Try this yourself now.

### 2) `dplyr::arrange()`

We use `arrange()` when we want to (re)order data based on row values. For example, say we want to sort the characters from youngest to oldest.


```r
starwars %>% 
  arrange(birth_year)
```

```
## # A tibble: 87 x 13
##    name  height  mass hair_color skin_color eye_color birth_year gender
##    <chr>  <int> <dbl> <chr>      <chr>      <chr>          <dbl> <chr> 
##  1 Wick…     88  20   brown      brown      brown            8   male  
##  2 IG-88    200 140   none       metal      red             15   none  
##  3 Luke…    172  77   blond      fair       blue            19   male  
##  4 Leia…    150  49   brown      light      brown           19   female
##  5 Wedg…    170  77   brown      fair       hazel           21   male  
##  6 Plo …    188  80   none       orange     black           22   male  
##  7 Bigg…    183  84   black      light      brown           24   male  
##  8 Han …    180  80   brown      fair       brown           29   male  
##  9 Land…    177  79   black      dark       brown           31   male  
## 10 Boba…    183  78.2 black      fair       brown           31.5 male  
## # … with 77 more rows, and 5 more variables: homeworld <chr>,
## #   species <chr>, films <list>, vehicles <list>, starships <list>
```

(Note that arranging on a character-based column --- i.e. strings --- will sort the data alphabetically. Try this yourself by arranging according to the "name" column.)

We can also arrange items in descending order using `arrange(desc())`.

```r
starwars %>% 
  arrange(desc(birth_year))
```

```
## # A tibble: 87 x 13
##    name  height  mass hair_color skin_color eye_color birth_year gender
##    <chr>  <int> <dbl> <chr>      <chr>      <chr>          <dbl> <chr> 
##  1 Yoda      66    17 white      green      brown            896 male  
##  2 Jabb…    175  1358 <NA>       green-tan… orange           600 herma…
##  3 Chew…    228   112 brown      unknown    blue             200 male  
##  4 C-3PO    167    75 <NA>       gold       yellow           112 <NA>  
##  5 Dooku    193    80 white      fair       brown            102 male  
##  6 Qui-…    193    89 brown      fair       blue              92 male  
##  7 Ki-A…    198    82 white      pale       yellow            92 male  
##  8 Fini…    170    NA blond      fair       blue              91 male  
##  9 Palp…    170    75 grey       pale       yellow            82 male  
## 10 Clie…    183    NA brown      fair       blue              82 male  
## # … with 77 more rows, and 5 more variables: homeworld <chr>,
## #   species <chr>, films <list>, vehicles <list>, starships <list>
```

### 3) `dplyr::select()`

So far we have been focusong on row-based operations. However, we use `select()` to subset data based on the columns. To select multiple columns, you can use commas. (Or, if you are selecting consecutive columns, you can also use the "first_column:last_column" format). 

```r
starwars %>% 
  select(name:skin_color, species)
```

```
## # A tibble: 87 x 6
##    name               height  mass hair_color    skin_color  species
##    <chr>               <int> <dbl> <chr>         <chr>       <chr>  
##  1 Luke Skywalker        172    77 blond         fair        Human  
##  2 C-3PO                 167    75 <NA>          gold        Droid  
##  3 R2-D2                  96    32 <NA>          white, blue Droid  
##  4 Darth Vader           202   136 none          white       Human  
##  5 Leia Organa           150    49 brown         light       Human  
##  6 Owen Lars             178   120 brown, grey   light       Human  
##  7 Beru Whitesun lars    165    75 brown         light       Human  
##  8 R5-D4                  97    32 <NA>          white, red  Droid  
##  9 Biggs Darklighter     183    84 black         light       Human  
## 10 Obi-Wan Kenobi        182    77 auburn, white fair        Human  
## # … with 77 more rows
```

You can deselect a column with a minus sign (i.e. "-"). Note, however, that deselecting multiple columns would require wrapping them in concatenation parenthesese: `select(..., -c(col1, col2, etc))`.


```r
starwars %>% 
  select(name:skin_color, species, -height)
```

```
## # A tibble: 87 x 5
##    name                mass hair_color    skin_color  species
##    <chr>              <dbl> <chr>         <chr>       <chr>  
##  1 Luke Skywalker        77 blond         fair        Human  
##  2 C-3PO                 75 <NA>          gold        Droid  
##  3 R2-D2                 32 <NA>          white, blue Droid  
##  4 Darth Vader          136 none          white       Human  
##  5 Leia Organa           49 brown         light       Human  
##  6 Owen Lars            120 brown, grey   light       Human  
##  7 Beru Whitesun lars    75 brown         light       Human  
##  8 R5-D4                 32 <NA>          white, red  Droid  
##  9 Biggs Darklighter     84 black         light       Human  
## 10 Obi-Wan Kenobi        77 auburn, white fair        Human  
## # … with 77 more rows
```

You can also rename some (or all) of your selected variables in place.^[A related command is "rename", which is useful if you just want to rename columns without changing the selection. See `?rename`.]  

```r
starwars %>%
  select(alias=name, crib=homeworld, sex=gender) 
```

```
## # A tibble: 87 x 3
##    alias              crib     sex   
##    <chr>              <chr>    <chr> 
##  1 Luke Skywalker     Tatooine male  
##  2 C-3PO              Tatooine <NA>  
##  3 R2-D2              Naboo    <NA>  
##  4 Darth Vader        Tatooine male  
##  5 Leia Organa        Alderaan female
##  6 Owen Lars          Tatooine male  
##  7 Beru Whitesun lars Tatooine female
##  8 R5-D4              Tatooine <NA>  
##  9 Biggs Darklighter  Tatooine male  
## 10 Obi-Wan Kenobi     Stewjon  male  
## # … with 77 more rows
```

The `select(contains(PATTERN))` option provides a nice shortcut in relevant cases.

```r
starwars %>% 
  select(name, contains("color"))
```

```
## # A tibble: 87 x 4
##    name               hair_color    skin_color  eye_color
##    <chr>              <chr>         <chr>       <chr>    
##  1 Luke Skywalker     blond         fair        blue     
##  2 C-3PO              <NA>          gold        yellow   
##  3 R2-D2              <NA>          white, blue red      
##  4 Darth Vader        none          white       yellow   
##  5 Leia Organa        brown         light       brown    
##  6 Owen Lars          brown, grey   light       blue     
##  7 Beru Whitesun lars brown         light       blue     
##  8 R5-D4              <NA>          white, red  red      
##  9 Biggs Darklighter  black         light       brown    
## 10 Obi-Wan Kenobi     auburn, white fair        blue-gray
## # … with 77 more rows
```

The `select(..., everything())` option is another useful shortcut if you want to bring some variable(s) to the "front" of your dataset.


```r
starwars %>% 
  select(species, homeworld, everything())
```

```
## # A tibble: 87 x 13
##    species homeworld name  height  mass hair_color skin_color eye_color
##    <chr>   <chr>     <chr>  <int> <dbl> <chr>      <chr>      <chr>    
##  1 Human   Tatooine  Luke…    172    77 blond      fair       blue     
##  2 Droid   Tatooine  C-3PO    167    75 <NA>       gold       yellow   
##  3 Droid   Naboo     R2-D2     96    32 <NA>       white, bl… red      
##  4 Human   Tatooine  Dart…    202   136 none       white      yellow   
##  5 Human   Alderaan  Leia…    150    49 brown      light      brown    
##  6 Human   Tatooine  Owen…    178   120 brown, gr… light      blue     
##  7 Human   Tatooine  Beru…    165    75 brown      light      blue     
##  8 Droid   Tatooine  R5-D4     97    32 <NA>       white, red red      
##  9 Human   Tatooine  Bigg…    183    84 black      light      brown    
## 10 Human   Stewjon   Obi-…    182    77 auburn, w… fair       blue-gray
## # … with 77 more rows, and 5 more variables: birth_year <dbl>,
## #   gender <chr>, films <list>, vehicles <list>, starships <list>
```


### `4) dplyr::mutate()`

We use `mutate()` to create new columns (i.e. variables). You can either create new columns from scratch, or (more commonly) as transformations of existing columns.

```r
starwars %>% 
  select(name, birth_year) %>%
  mutate(dog_years = birth_year * 7) %>%
  mutate(comment = paste0(name, " is ", dog_years, " in dog years."))
```

```
## # A tibble: 87 x 4
##    name             birth_year dog_years comment                           
##    <chr>                 <dbl>     <dbl> <chr>                             
##  1 Luke Skywalker         19        133  Luke Skywalker is 133 in dog year…
##  2 C-3PO                 112        784  C-3PO is 784 in dog years.        
##  3 R2-D2                  33        231  R2-D2 is 231 in dog years.        
##  4 Darth Vader            41.9      293. Darth Vader is 293.3 in dog years.
##  5 Leia Organa            19        133  Leia Organa is 133 in dog years.  
##  6 Owen Lars              52        364  Owen Lars is 364 in dog years.    
##  7 Beru Whitesun l…       47        329  Beru Whitesun lars is 329 in dog …
##  8 R5-D4                  NA         NA  R5-D4 is NA in dog years.         
##  9 Biggs Darklight…       24        168  Biggs Darklighter is 168 in dog y…
## 10 Obi-Wan Kenobi         57        399  Obi-Wan Kenobi is 399 in dog year…
## # … with 77 more rows
```

Note that `mutate()` is order aware. So you can chain multiple mutations in a single call, even if a a latter mutation relies on an earlier one.

```r
starwars %>% 
  select(name, birth_year) %>%
  mutate(
    dog_years = birth_year * 7, ## Separate with a comma
    comment = paste0(name, " is ", dog_years, " in dog years.")
    )
```

```
## # A tibble: 87 x 4
##    name             birth_year dog_years comment                           
##    <chr>                 <dbl>     <dbl> <chr>                             
##  1 Luke Skywalker         19        133  Luke Skywalker is 133 in dog year…
##  2 C-3PO                 112        784  C-3PO is 784 in dog years.        
##  3 R2-D2                  33        231  R2-D2 is 231 in dog years.        
##  4 Darth Vader            41.9      293. Darth Vader is 293.3 in dog years.
##  5 Leia Organa            19        133  Leia Organa is 133 in dog years.  
##  6 Owen Lars              52        364  Owen Lars is 364 in dog years.    
##  7 Beru Whitesun l…       47        329  Beru Whitesun lars is 329 in dog …
##  8 R5-D4                  NA         NA  R5-D4 is NA in dog years.         
##  9 Biggs Darklight…       24        168  Biggs Darklighter is 168 in dog y…
## 10 Obi-Wan Kenobi         57        399  Obi-Wan Kenobi is 399 in dog year…
## # … with 77 more rows
```

Boolean, logical and conditional operators all work well with `mutate()` too.

```r
starwars %>% 
  select(name, height) %>%
  filter(name %in% c("Luke Skywalker", "Anakin Skywalker")) %>% 
  mutate(tall1 = height > 180) %>%
  mutate(tall2 = ifelse(height > 180, "Tall", "Short")) ## Same effect, but can choose labels
```

```
## # A tibble: 2 x 4
##   name             height tall1 tall2
##   <chr>             <int> <lgl> <chr>
## 1 Luke Skywalker      172 FALSE Short
## 2 Anakin Skywalker    188 TRUE  Tall
```

Lastly, there are "scoped" variants of `mutate()` that work on a subset of variables.
- `mutate_all()` affects every variable
- `mutate_at()` affects named or selected variables
- `mutate_if()` affects variables that meet some criteria (e.g. are numeric)

See `?mutate_all` for more details and examples, but here's a silly example using the latter:


```r
starwars %>% select(name:eye_color) %>% mutate_if(is.character, toupper)
```

```
## # A tibble: 87 x 6
##    name               height  mass hair_color    skin_color  eye_color
##    <chr>               <int> <dbl> <chr>         <chr>       <chr>    
##  1 LUKE SKYWALKER        172    77 BLOND         FAIR        BLUE     
##  2 C-3PO                 167    75 <NA>          GOLD        YELLOW   
##  3 R2-D2                  96    32 <NA>          WHITE, BLUE RED      
##  4 DARTH VADER           202   136 NONE          WHITE       YELLOW   
##  5 LEIA ORGANA           150    49 BROWN         LIGHT       BROWN    
##  6 OWEN LARS             178   120 BROWN, GREY   LIGHT       BLUE     
##  7 BERU WHITESUN LARS    165    75 BROWN         LIGHT       BLUE     
##  8 R5-D4                  97    32 <NA>          WHITE, RED  RED      
##  9 BIGGS DARKLIGHTER     183    84 BLACK         LIGHT       BROWN    
## 10 OBI-WAN KENOBI        182    77 AUBURN, WHITE FAIR        BLUE-GRAY
## # … with 77 more rows
```


### `5) dplyr::summarise()`

We use `summarise()` (or `summarize()`) when we want collapse multiple observations (i.e. rows) down into a single observation. This is particularly useful in combination with the `group_by()` command.

```r
starwars %>% 
  group_by(species, gender) %>% 
  summarise(mean_height = mean(height, na.rm = T))
```

```
## # A tibble: 43 x 3
## # Groups:   species [?]
##    species   gender mean_height
##    <chr>     <chr>        <dbl>
##  1 Aleena    male            79
##  2 Besalisk  male           198
##  3 Cerean    male           198
##  4 Chagrian  male           196
##  5 Clawdite  female         168
##  6 Droid     none           200
##  7 Droid     <NA>           120
##  8 Dug       male           112
##  9 Ewok      male            88
## 10 Geonosian male           183
## # … with 33 more rows
```

Note that including "na.rm=T" is usually a good idea with summary functions. Otherwise, any missing value will propogate to the summarised value too.

```r
## Probably not what we want
starwars %>% summarise(mean_height = mean(height))
```

```
## # A tibble: 1 x 1
##   mean_height
##         <dbl>
## 1          NA
```

```r
## Much better
starwars %>% summarise(mean_height = mean(height, na.rm=T))
```

```
## # A tibble: 1 x 1
##   mean_height
##         <dbl>
## 1        174.
```

The "scoped" variants that we saw earlier also work with `summarise()`
- `summarise_all()` affects every variable
- `summarise_at()` affects named or selected variables
- `summarise_if()` affects variables that meet some criteria (e.g. are numeric)

Again, see `?summarise_at` for more details and examples. However, here's an example using the latter:


```r
starwars %>% group_by(species, gender) %>% summarise_if(is.numeric, mean, na.rm=T)
```

```
## # A tibble: 43 x 5
## # Groups:   species [?]
##    species   gender height  mass birth_year
##    <chr>     <chr>   <dbl> <dbl>      <dbl>
##  1 Aleena    male       79  15        NaN  
##  2 Besalisk  male      198 102        NaN  
##  3 Cerean    male      198  82         92  
##  4 Chagrian  male      196 NaN        NaN  
##  5 Clawdite  female    168  55        NaN  
##  6 Droid     none      200 140         15  
##  7 Droid     <NA>      120  46.3       72.5
##  8 Dug       male      112  40        NaN  
##  9 Ewok      male       88  20          8  
## 10 Geonosian male      183  80        NaN  
## # … with 33 more rows
```

And one more, just to show how we can add flexibility to our scoped calls. This time, I going to use the `funs(suffix=FUNCTION)` option, which will append a helpful suffix to our summarised variables. (You can also use it to implement scoped transformations based on your own functions.)


```r
starwars %>% group_by(species, gender) %>% summarise_if(is.numeric, funs(avg=mean), na.rm=T)
```

```
## # A tibble: 43 x 5
## # Groups:   species [?]
##    species   gender height_avg mass_avg birth_year_avg
##    <chr>     <chr>       <dbl>    <dbl>          <dbl>
##  1 Aleena    male           79     15            NaN  
##  2 Besalisk  male          198    102            NaN  
##  3 Cerean    male          198     82             92  
##  4 Chagrian  male          196    NaN            NaN  
##  5 Clawdite  female        168     55            NaN  
##  6 Droid     none          200    140             15  
##  7 Droid     <NA>          120     46.3           72.5
##  8 Dug       male          112     40            NaN  
##  9 Ewok      male           88     20              8  
## 10 Geonosian male          183     80            NaN  
## # … with 33 more rows
```

### Other dplyr goodies

`group_by()` and `ungroup()`: For (un)grouping.

- Particularly useful with the `summarise()` and `mutate()` commands, as we've already seen.

`slice()`: Subset rows by position rather than filtering by values.

- E.g. `starwars %>% slice(c(1, 5))`

`pull()`: Extract a column from as a data frame as a vector or scalar.

- E.g. `starwars %>% filter(gender=="female") %>% pull(height)`

`count()` and `distinct()`: Number and isolate unique observations.

- E.g. `starwars %>% count(species)`, or `starwars %>% distinct(species)`
- You could also use a combination of `mutate()`, `group_by()`, and `n()`, e.g. `starwars %>% group_by(species) %>% mutate(num = n())`.

There are also a whole class of [window functions](https://cran.r-project.org/web/packages/dplyr/vignettes/window-functions.html) for getting leads and lags, ranking, creating cumulative aggregates, etc.

- See `vignette("window-functions")`.

The final set of dplyr "goodies" are the family of join operations. However, these are important enough that I want to go over some concepts in a bit more depth. (We encounter and practice these many more times as the course progresses.)

### Joining operations

One of the mainstays of the dplyr package is merging data with the family [join operations](https://cran.r-project.org/web/packages/dplyr/vignettes/two-table.html).

- `inner_join(df1, df2)`
- `left_join(df1, df2)`
- `right_join(df1, df2)`
- `full_join(df1, df2)`
- `semi_join(df1, df2)`
- `anti_join(df1, df2)`

For the simple examples that I'm going to show here, we'll need some data sets that come bundled with the [nycflights13 package](http://github.com/hadley/nycflights13). Let's load it now and quickly inspect the `flights` and `planes` datasets.


```r
library(nycflights13)
flights 
```

```
## # A tibble: 336,776 x 19
##     year month   day dep_time sched_dep_time dep_delay arr_time
##    <int> <int> <int>    <int>          <int>     <dbl>    <int>
##  1  2013     1     1      517            515         2      830
##  2  2013     1     1      533            529         4      850
##  3  2013     1     1      542            540         2      923
##  4  2013     1     1      544            545        -1     1004
##  5  2013     1     1      554            600        -6      812
##  6  2013     1     1      554            558        -4      740
##  7  2013     1     1      555            600        -5      913
##  8  2013     1     1      557            600        -3      709
##  9  2013     1     1      557            600        -3      838
## 10  2013     1     1      558            600        -2      753
## # … with 336,766 more rows, and 12 more variables: sched_arr_time <int>,
## #   arr_delay <dbl>, carrier <chr>, flight <int>, tailnum <chr>,
## #   origin <chr>, dest <chr>, air_time <dbl>, distance <dbl>, hour <dbl>,
## #   minute <dbl>, time_hour <dttm>
```

```r
planes
```

```
## # A tibble: 3,322 x 9
##    tailnum  year type       manufacturer  model  engines seats speed engine
##    <chr>   <int> <chr>      <chr>         <chr>    <int> <int> <int> <chr> 
##  1 N10156   2004 Fixed win… EMBRAER       EMB-1…       2    55    NA Turbo…
##  2 N102UW   1998 Fixed win… AIRBUS INDUS… A320-…       2   182    NA Turbo…
##  3 N103US   1999 Fixed win… AIRBUS INDUS… A320-…       2   182    NA Turbo…
##  4 N104UW   1999 Fixed win… AIRBUS INDUS… A320-…       2   182    NA Turbo…
##  5 N10575   2002 Fixed win… EMBRAER       EMB-1…       2    55    NA Turbo…
##  6 N105UW   1999 Fixed win… AIRBUS INDUS… A320-…       2   182    NA Turbo…
##  7 N107US   1999 Fixed win… AIRBUS INDUS… A320-…       2   182    NA Turbo…
##  8 N108UW   1999 Fixed win… AIRBUS INDUS… A320-…       2   182    NA Turbo…
##  9 N109UW   1999 Fixed win… AIRBUS INDUS… A320-…       2   182    NA Turbo…
## 10 N110UW   1999 Fixed win… AIRBUS INDUS… A320-…       2   182    NA Turbo…
## # … with 3,312 more rows
```

Let's perform a [left join](https://stat545.com/bit001_dplyr-cheatsheet.html#left_joinsuperheroes-publishers) on the flights and planes datasets. I'm also going subset columns after the join using `select()`, but only to keep the columns readable on this page.


```r
# flights %>% left_join(planes) ## works too
left_join(flights, planes) %>%
  select(year, month, day, dep_time, arr_time, carrier, flight, tailnum, type, model)
```

```
## Joining, by = c("year", "tailnum")
```

```
## # A tibble: 336,776 x 10
##     year month   day dep_time arr_time carrier flight tailnum type  model
##    <int> <int> <int>    <int>    <int> <chr>    <int> <chr>   <chr> <chr>
##  1  2013     1     1      517      830 UA        1545 N14228  <NA>  <NA> 
##  2  2013     1     1      533      850 UA        1714 N24211  <NA>  <NA> 
##  3  2013     1     1      542      923 AA        1141 N619AA  <NA>  <NA> 
##  4  2013     1     1      544     1004 B6         725 N804JB  <NA>  <NA> 
##  5  2013     1     1      554      812 DL         461 N668DN  <NA>  <NA> 
##  6  2013     1     1      554      740 UA        1696 N39463  <NA>  <NA> 
##  7  2013     1     1      555      913 B6         507 N516JB  <NA>  <NA> 
##  8  2013     1     1      557      709 EV        5708 N829AS  <NA>  <NA> 
##  9  2013     1     1      557      838 B6          79 N593JB  <NA>  <NA> 
## 10  2013     1     1      558      753 AA         301 N3ALAA  <NA>  <NA> 
## # … with 336,766 more rows
```

Note that `dplyr` made a reasonable guess about which columns to join on (i.e. columns that share the same name). It also told us its choices: 

```
*## Joining, by = c("year", "tailnum")
```

However, there's an obvious problem here: the variable "year" does not have a consistent meaning across our joining datasets! (In one it refers to the *year of flight*, in the other it refers to *year of construction*.) 

Luckily, there's an easy way to avoid this problem: You just need to be more explicit in your join call by using the `by = ` argument. You can also rename any ambiguous columns to avoid confusion. 

```r
left_join(
  flights,
  planes %>% rename(year_built = year), ## Not necessary w/ below line, but helpful
  by = "tailnum" ## Be specific about the joining column
  ) %>%
  select(year, month, day, dep_time, arr_time, carrier, flight, tailnum, year_built, type, model)
```

```
## # A tibble: 336,776 x 11
##     year month   day dep_time arr_time carrier flight tailnum year_built
##    <int> <int> <int>    <int>    <int> <chr>    <int> <chr>        <int>
##  1  2013     1     1      517      830 UA        1545 N14228        1999
##  2  2013     1     1      533      850 UA        1714 N24211        1998
##  3  2013     1     1      542      923 AA        1141 N619AA        1990
##  4  2013     1     1      544     1004 B6         725 N804JB        2012
##  5  2013     1     1      554      812 DL         461 N668DN        1991
##  6  2013     1     1      554      740 UA        1696 N39463        2012
##  7  2013     1     1      555      913 B6         507 N516JB        2000
##  8  2013     1     1      557      709 EV        5708 N829AS        1998
##  9  2013     1     1      557      838 B6          79 N593JB        2004
## 10  2013     1     1      558      753 AA         301 N3ALAA          NA
## # … with 336,766 more rows, and 2 more variables: type <chr>, model <chr>
```

I'll mention one last thing for now. Note what happens if we again specify the join column... but this time don't rename the ambiguous "year" column in at least one of the given data frames.

```r
left_join(
  flights,
  planes, ## Not renaming "year" to "year_built" this time
  by = "tailnum"
  ) %>%
  select(contains("year"), month, day, dep_time, arr_time, carrier, flight, tailnum, type, model)
```

```
## # A tibble: 336,776 x 11
##    year.x year.y month   day dep_time arr_time carrier flight tailnum type 
##     <int>  <int> <int> <int>    <int>    <int> <chr>    <int> <chr>   <chr>
##  1   2013   1999     1     1      517      830 UA        1545 N14228  Fixe…
##  2   2013   1998     1     1      533      850 UA        1714 N24211  Fixe…
##  3   2013   1990     1     1      542      923 AA        1141 N619AA  Fixe…
##  4   2013   2012     1     1      544     1004 B6         725 N804JB  Fixe…
##  5   2013   1991     1     1      554      812 DL         461 N668DN  Fixe…
##  6   2013   2012     1     1      554      740 UA        1696 N39463  Fixe…
##  7   2013   2000     1     1      555      913 B6         507 N516JB  Fixe…
##  8   2013   1998     1     1      557      709 EV        5708 N829AS  Fixe…
##  9   2013   2004     1     1      557      838 B6          79 N593JB  Fixe…
## 10   2013     NA     1     1      558      753 AA         301 N3ALAA  <NA> 
## # … with 336,766 more rows, and 1 more variable: model <chr>
```

Bottom line: Make sure you know what "year.x" and "year.y" are. Again, it pays to be specific.


## Data tidying with `tidyr`

Similar to `dplyr`, there are a set of key `tidyr` verbs that need to learn.

1. `gather()`: Gather (or "melt") wide data into long format

2. `spread()`: Spread (or "cast") long data into wide format. 

3. `separate()`: Separate (i.e. split) one column into multiple columns.

4. `unite()`: Unite (i.e. combine) multiple columns into one.

Let's practice these verbs together. (Side question: Which of `gather()` vs `spread()` produces "tidy" data?)

### 1) `tidyr::gather()`

For the next few examples, I'm going to create some new data frames.^[Actually, I'm going to use the tidyverse-enhanced version of data frames, i.e. "tibbles", but that's certaintly not necessary.] Remember that in R this easy (encouraged even!) because it allows for multiple objects in memory at the same time.

Let's start out with a data frame of hypothetical stock prices.


```r
stocks <- 
  tibble( ## Could use a standard "data.frame" instead of "tibble" if you prefer
    time = as.Date('2009-01-01') + 0:1,
    X = rnorm(2, 0, 1),
    Y = rnorm(2, 0, 2),
    Z = rnorm(2, 0, 4)
    )
stocks
```

```
## # A tibble: 2 x 4
##   time            X       Y     Z
##   <date>      <dbl>   <dbl> <dbl>
## 1 2009-01-01 -1.53  -0.0598 -6.05
## 2 2009-01-02 -0.564 -0.778   2.93
```

The data are in untidy ("wide") format. We'll use `gather()` to convert it to tidy ("narrow") format. 


```r
tidy_stocks <- stocks %>% gather(stock, price, -time)
tidy_stocks
```

```
## # A tibble: 6 x 3
##   time       stock   price
##   <date>     <chr>   <dbl>
## 1 2009-01-01 X     -1.53  
## 2 2009-01-02 X     -0.564 
## 3 2009-01-01 Y     -0.0598
## 4 2009-01-02 Y     -0.778 
## 5 2009-01-01 Z     -6.05  
## 6 2009-01-02 Z      2.93
```

Notice that we used the minus sign (`-`) to exclude the "time" variable from the gathering process. In effect, we were telling `gather()` that this variable is already in tidy format and can act as an anchor point for the remaining transformation. (Try running the previous code chunk without excluding "time" from the `gather()` transformation. What happens?)


**Aside: Remembering the `gather()` syntax.** There's a long-running joke about no-one being able to remember Stata's "reshape" command. ([Exhibit A](https://twitter.com/scottimberman/status/1036801308785864704).) It's easy to see this happening with `gather()` too. However, I find that I never forget the command as long as I remember the argument order is *"key"* then *"value"*.

```r
## Write out the argument names this time: i.e. "key=" and "value="
stocks %>% gather(key=stock, value=price, -time)
```

```
##         time stock      price
## 1 2009-01-01     X -1.5335931
## 2 2009-01-02     X -0.5643349
## 3 2009-01-01     Y -0.0597589
## 4 2009-01-02     Y -0.7781918
## 5 2009-01-01     Z -6.0530427
## 6 2009-01-02     Z  2.9314994
```

### 2) `tidyr::spread()`

`spread()` moves in the opposite direction, converting data from narrow format to wide format. While this would appear to contravene our adherence to tidy data principles, there are occasions where it makes sense. For example, if you want to to view a dataset in more human-readable form, or if you want to use a `ggplot2` geom that requires "ymin" and "ymax" aesthetics as separate variables (e.g. [geom_pointrange](https://ggplot2.tidyverse.org/reference/geom_linerange.html) or [geom_ribbon](https://ggplot2.tidyverse.org/reference/geom_ribbon.html).)


```r
tidy_stocks %>% spread(stock, price)
```

```
## # A tibble: 2 x 4
##   time            X       Y     Z
##   <date>      <dbl>   <dbl> <dbl>
## 1 2009-01-01 -1.53  -0.0598 -6.05
## 2 2009-01-02 -0.564 -0.778   2.93
```

Another use case is if you want to spread your data over a different wide format. This approach effectively combines `gather()` and `separate()`, with each step emphasising different key-value combinations. For example, maybe we want the data to be wide in tems of dates.


```r
tidy_stocks %>% spread(time, price)
```

```
## # A tibble: 3 x 3
##   stock `2009-01-01` `2009-01-02`
##   <chr>        <dbl>        <dbl>
## 1 X          -1.53         -0.564
## 2 Y          -0.0598       -0.778
## 3 Z          -6.05          2.93
```

### 3) `tidyr::separate()`

We can use `separate()` to split one column into two, based on an identifiable separation character.


```r
economists <- tibble(name = c("Adam.Smith", "Paul.Samuelson", "Milton.Friedman"))
economists
```

```
## # A tibble: 3 x 1
##   name           
##   <chr>          
## 1 Adam.Smith     
## 2 Paul.Samuelson 
## 3 Milton.Friedman
```

```r
economists %>% separate(name, c("first_name", "last_name")) 
```

```
## # A tibble: 3 x 2
##   first_name last_name
##   <chr>      <chr>    
## 1 Adam       Smith    
## 2 Paul       Samuelson
## 3 Milton     Friedman
```

The `separate()` command is pretty smart. But to avoid ambiguity, you can also specify the separation character with `separate(..., sep=".")`. Try this yourself to confirm.

A related function is `separate_rows()`, for splitting up cells that contain multiple fields or observations (a frustratingly common occurence with survey data).

```r
jobs <- 
  tibble(
    name = c("Jack", "Jill"),
    occupation = c("Homemaker", "Philosopher, Philanthropist, Troublemaker") 
    )
```

Now split out Jill's various occupations into different rows


```r
jobs %>% separate_rows(occupation)
```

```
## # A tibble: 4 x 2
##   name  occupation    
##   <chr> <chr>         
## 1 Jack  Homemaker     
## 2 Jill  Philosopher   
## 3 Jill  Philanthropist
## 4 Jill  Troublemaker
```

### 4) `tidyr::unite()`

In direct contrast to `separate()`, we can use `unite()` to combine multiple columns into one.


```r
gdp <- 
  tibble(
    yr = rep(2016, times = 4),
    mnth = rep(1, times = 4),
    dy = 1:4,
    gdp = rnorm(4, mean = 100, sd = 2)
    )
gdp 
```

```
## # A tibble: 4 x 4
##      yr  mnth    dy   gdp
##   <dbl> <dbl> <int> <dbl>
## 1  2016     1     1 100. 
## 2  2016     1     2 100. 
## 3  2016     1     3  99.3
## 4  2016     1     4 105.
```

```r
## Combine "yr", "mnth", and "dy" into one "date" column
gdp %>% unite(date, c("yr", "mnth", "dy"), sep = "-")
```

```
## # A tibble: 4 x 2
##   date       gdp
##   <chr>    <dbl>
## 1 2016-1-1 100. 
## 2 2016-1-2 100. 
## 3 2016-1-3  99.3
## 4 2016-1-4 105.
```

One thing I want to flag is that `unite()` will automatically create a character variable. If you want to convert it to something else (e.g. date or numeric) then you will need to modify it using `mutate()`.^[`transmute` is another option. It is a variation of `mutate()`, whichs drops existing variables.] Here's an example using one of the [lubridate](https://lubridate.tidyverse.org/) package's incredibly helpful date conversion functions.


```r
library(lubridate)
gdp %>% 
  unite(date, c("yr", "mnth", "dy"), sep = "-") %>%
  mutate(date = ymd(date))
```

```
## # A tibble: 4 x 2
##   date         gdp
##   <date>     <dbl>
## 1 2016-01-01 100. 
## 2 2016-01-02 100. 
## 3 2016-01-03  99.3
## 4 2016-01-04 105.
```

### Other tidyr goodies

Use `crossing()` to get the full combination of a group of variables.^[Base R alternative: `expand.grid()`]


```r
crossing(side=c("left", "right"), height=c("top", "bottom"))
```

```
## # A tibble: 4 x 2
##   side  height
##   <chr> <chr> 
## 1 left  bottom
## 2 left  top   
## 3 right bottom
## 4 right top
```

See `?expand()` and `?complete()` for more specialised functions that allow you to fill in (implicit) missing data or variable combinations in existing data frames.

- You'll encounter this during your next assignment.

## Summary

### Key verbs

A huge amount data wrangling and tidying can achieved simply by remembering some key tidyverse verbs.

For `dplyr`:

1. `filter()`
2. `arrange()`
3. `select()`
4. `mutate()`
5. `summarise()`

For `tidyr`:

1. `gather()`
2. `spread()`
3. `separate()`
4. `unite()`

Other useful items include: pipes (`%>%`), grouping (`group_by()`), joining functions (`left_join()`, `inner_join`, etc.).

### Assignment 2

Assignment 2 is now up on GitHub Classroom.

- Hone your data wrangling and cleaning skills on a dataset culled from the wild.
- This one will take some of you a while to get through, so please get started early.
- Deadline: One week from today.

### Next lecture 

The first of our webscraping lectures.
