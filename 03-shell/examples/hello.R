args = commandArgs(trailingOnly = TRUE)
i = args[1]; j = args[2]

cat('Hello World, from R!\n', 
     i, '+', j, '=', as.integer(i) + as.integer(j))
